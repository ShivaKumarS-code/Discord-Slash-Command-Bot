import { Router } from "express"
import { requireAuth } from "../middleware/auth"
import { prisma } from "../dependencies/prisma"

const router = Router()

/**
 * GET /api/v1/servers
 * Returns the list of connected servers owned by the authenticated database user.
 */
router.get("/", requireAuth, async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      error: {
        status: 401,
        message: "Unauthorized: Missing user context"
      }
    })
    return
  }

  try {
    const servers = await prisma.server.findMany({
      where: { owner_id: req.user.id },
      include: {
        config: true
      }
    })

    // BigInt values must be serialized to string before returning in JSON response
    const formattedServers = servers.map(server => ({
      id: server.id,
      discord_guild_id: server.discord_guild_id.toString(),
      name: server.name,
      owner_id: server.owner_id,
      created_at: server.created_at,
      updated_at: server.updated_at,
      config: server.config ? {
        id: server.config.id,
        server_id: server.config.server_id,
        mirror_channel_id: server.config.mirror_channel_id?.toString() || null,
        default_command_channel_id: server.config.default_command_channel_id?.toString() || null,
        logging_enabled: server.config.logging_enabled,
        ai_enabled: server.config.ai_enabled
      } : null
    }))

    res.json(formattedServers)
  } catch (err: any) {
    console.error("Error fetching connected servers:", err)
    res.status(500).json({
      error: {
        status: 500,
        message: err.message || "Failed to fetch connected servers from database"
      }
    })
  }
})

/**
 * GET /api/v1/servers/:id
 * Returns the detailed metadata, configs, and command list of a single server owned by the authenticated database user.
 */
router.get("/:id", requireAuth, async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      error: {
        status: 401,
        message: "Unauthorized: Missing user context"
      }
    })
    return
  }

  const { id } = req.params

  try {
    const server = await prisma.server.findFirst({
      where: {
        id,
        owner_id: req.user.id
      },
      include: {
        config: true,
        command_configs: true
      }
    })

    if (!server) {
      res.status(404).json({
        error: {
          status: 404,
          message: "Server not found or access denied"
        }
      })
      return
    }

    // Format BigInt attributes safely
    const formattedServer = {
      id: server.id,
      discord_guild_id: server.discord_guild_id.toString(),
      name: server.name,
      owner_id: server.owner_id,
      created_at: server.created_at,
      updated_at: server.updated_at,
      config: server.config ? {
        id: server.config.id,
        server_id: server.config.server_id,
        mirror_channel_id: server.config.mirror_channel_id?.toString() || null,
        default_command_channel_id: server.config.default_command_channel_id?.toString() || null,
        logging_enabled: server.config.logging_enabled,
        ai_enabled: server.config.ai_enabled
      } : null,
      command_configs: server.command_configs.map(cmd => ({
        id: cmd.id,
        server_id: cmd.server_id,
        command_name: cmd.command_name,
        enabled: cmd.enabled,
        ai_enabled: cmd.ai_enabled,
        mirror_enabled: cmd.mirror_enabled
      }))
    }

    res.json(formattedServer)
  } catch (err: any) {
    console.error(`Error fetching server details for ${id}:`, err)
    res.status(500).json({
      error: {
        status: 500,
        message: err.message || "Failed to fetch server details"
      }
    })
  }
})

/**
 * GET /api/v1/servers/:id/channels
 * Returns a list of text channels inside the Discord server guild.
 */
router.get("/:id/channels", requireAuth, async (req, res) => {
  // Enforce authentication
  if (!req.user) {
    res.status(401).json({ error: { message: "Unauthorized" } })
    return
  }

  // Under a future phase this calls the Discord API.
  // For now, it returns mock channels.
  res.json([
    { id: "1", name: "general" },
    { id: "2", name: "logs" },
    { id: "3", name: "bot-spam" },
    { id: "4", name: "announcements" }
  ])
})

/**
 * PUT /api/v1/servers/:id/config
 * Updates mirroring channel and logging configuration for a specific server.
 */
router.put("/:id/config", requireAuth, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: { message: "Unauthorized" } })
    return
  }
  
  const { id } = req.params
  const { logging_enabled, mirror_channel_id } = req.body

  try {
    // Validate ownership
    const server = await prisma.server.findFirst({
      where: { id, owner_id: req.user.id }
    })
    
    if (!server) {
      res.status(404).json({ error: { message: "Server not found or access denied" } })
      return
    }

    // Upsert server configuration
    const config = await prisma.serverConfig.upsert({
      where: { server_id: id },
      update: {
        logging_enabled: logging_enabled ?? true,
        mirror_channel_id: mirror_channel_id ? BigInt(mirror_channel_id) : null
      },
      create: {
        server_id: id,
        logging_enabled: logging_enabled ?? true,
        mirror_channel_id: mirror_channel_id ? BigInt(mirror_channel_id) : null
      }
    })

    res.json({
      id: config.id,
      server_id: config.server_id,
      mirror_channel_id: config.mirror_channel_id?.toString() || null,
      default_command_channel_id: config.default_command_channel_id?.toString() || null,
      logging_enabled: config.logging_enabled,
      ai_enabled: config.ai_enabled
    })
  } catch (err: any) {
    console.error(`Error updating server config for ${id}:`, err)
    res.status(500).json({ error: { message: err.message || "Failed to update server configurations" } })
  }
})

/**
 * PUT /api/v1/servers/:id/commands
 * Configures behaviors (enabled, ai toggles, mirror log) for commands on this server.
 */
router.put("/:id/commands", requireAuth, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: { message: "Unauthorized" } })
    return
  }

  const { id } = req.params
  const { commands } = req.body // Expects array of { command_name, enabled, ai_enabled, mirror_enabled }

  if (!Array.isArray(commands)) {
    res.status(400).json({ error: { message: "Bad Request: Expected commands array" } })
    return
  }

  try {
    // Validate ownership
    const server = await prisma.server.findFirst({
      where: { id, owner_id: req.user.id }
    })

    if (!server) {
      res.status(404).json({ error: { message: "Server not found or access denied" } })
      return
    }

    const results = []
    
    // Upsert configurations for each command
    for (const cmd of commands) {
      const config = await prisma.commandConfig.upsert({
        where: {
          uq_command_configs_server_command: {
            server_id: id,
            command_name: cmd.command_name
          }
        },
        update: {
          enabled: cmd.enabled,
          ai_enabled: cmd.ai_enabled,
          mirror_enabled: cmd.mirror_enabled
        },
        create: {
          server_id: id,
          command_name: cmd.command_name,
          enabled: cmd.enabled,
          ai_enabled: cmd.ai_enabled,
          mirror_enabled: cmd.mirror_enabled
        }
      })
      
      results.push({
        id: config.id,
        server_id: config.server_id,
        command_name: config.command_name,
        enabled: config.enabled,
        ai_enabled: config.ai_enabled,
        mirror_enabled: config.mirror_enabled
      })
    }

    res.json(results)
  } catch (err: any) {
    console.error(`Error updating command configurations for ${id}:`, err)
    res.status(500).json({ error: { message: err.message || "Failed to save command configurations" } })
  }
})

export default router
