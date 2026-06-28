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

export default router
