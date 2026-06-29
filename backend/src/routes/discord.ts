import { Router } from "express"
import DiscordService from "../services/discordService"
import { supabaseAdmin } from "../integrations/supabase"
import { prisma } from "../dependencies/prisma"
import { requireAuth } from "../middleware/auth"
import verifyDiscordSignature from "../middleware/signatureVerification"
import InteractionService from "../services/interactionService"
import CommandService from "../services/commandService"
import { env } from "../config/env"

const router = Router()

/**
 * GET /api/v1/discord/connect
 * Redirects the user's browser to the Discord OAuth page to authorize identify/guilds access
 * and invite the bot to a specific guild.
 * Expects the Supabase JWT token as a query parameter (?token=...) to authenticate.
 */
router.get("/connect", async (req, res) => {
  const { token } = req.query

  if (!token || typeof token !== "string") {
    res.status(400).json({
      error: {
        status: 400,
        message: "Bad Request: Missing token query parameter"
      }
    })
    return
  }

  try {
    // Validate token with Supabase to resolve user identity
    const { data: { user: supabaseUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !supabaseUser) {
      res.status(401).json({
        error: {
          status: 401,
          message: `Unauthorized: ${authError?.message || "Invalid token credentials"}`
        }
      })
      return
    }

    // Pass the user's Supabase User UID in the state parameter to verify identity upon redirect
    const authorizationUrl = DiscordService.getAuthorizationUrl(supabaseUser.id)
    res.redirect(authorizationUrl)
  } catch (err: any) {
    console.error("❌ Connect route failed:", err)
    res.status(500).json({
      error: {
        status: 500,
        message: "Internal server error establishing OAuth connect link"
      }
    })
  }
})

/**
 * GET /api/v1/discord/callback
 * Handles callback requests from the Discord authorization page.
 * Exchanges the query auth code, fetches guilds, associates with database user, and upserts server configurations.
 */
router.get("/callback", async (req, res) => {
  const { code, error, error_description, guild_id, state } = req.query

  if (error) {
    res.status(400).json({
      error: {
        status: 400,
        message: `Discord Authentication Error: ${error_description || error}`
      }
    })
    return
  }

  if (!code || typeof code !== "string") {
    res.status(400).json({
      error: {
        status: 400,
        message: "Bad Request: Missing or invalid authorization code"
      }
    })
    return
  }

  if (!state || typeof state !== "string") {
    res.status(400).json({
      error: {
        status: 400,
        message: "Bad Request: Missing state parameter"
      }
    })
    return
  }

  try {
    // Lookup database user profile associated with the state (supabase_user_id)
    const dbUser = await prisma.user.findUnique({
      where: { supabase_user_id: state }
    })

    if (!dbUser) {
      res.status(400).json({
        error: {
          status: 400,
          message: "Bad Request: Initiating database user context not found"
        }
      })
      return
    }

    // Exchange authentication code for access tokens
    const tokens = await DiscordService.exchangeCode(code)

    // Retrieve user guilds (what servers the user is in)
    const userGuilds = await DiscordService.getUserGuilds(tokens.access_token)

    // Identify which guild was authorized during this flow
    const guildIdStr = (guild_id || tokens.guild?.id) as string

    if (!guildIdStr) {
      res.status(400).json({
        error: {
          status: 400,
          message: "Bad Request: Discord did not return a valid guild_id"
        }
      })
      return
    }

    // Find details about the authorized guild in the user's server list
    const targetGuild = userGuilds.find(g => g.id === guildIdStr)
    const serverName = targetGuild?.name || "Discord Server"

    // Upsert server record in the database using the unique discord_guild_id
    const serverRecord = await prisma.server.upsert({
      where: { discord_guild_id: BigInt(guildIdStr) },
      update: {
        name: serverName,
        owner_id: dbUser.id
      },
      create: {
        discord_guild_id: BigInt(guildIdStr),
        name: serverName,
        owner_id: dbUser.id
      }
    })

    // Automatically create default server config if it doesn't exist
    await prisma.serverConfig.upsert({
      where: { server_id: serverRecord.id },
      update: {}, // do nothing on update
      create: {
        server_id: serverRecord.id,
        logging_enabled: true,
        ai_enabled: true
      }
    })

    console.info(`⚡ Discord Server Connected: ${serverName} (${guildIdStr}) associated with User: ${dbUser.email}`)

    // Redirect the user back to the client-side connected servers view
    res.redirect(`${env.DASHBOARD_URL}/servers?connection=success`)
  } catch (err: any) {
    console.error("❌ Discord OAuth callback failure:", err)
    res.status(500).json({
      error: {
        status: 500,
        message: err.message || "Failed to process Discord OAuth callback exchange"
      }
    })
  }
})

/**
 * POST /api/v1/discord/sync-commands
 * Synchronizes guild commands (/status and /report) with Discord's REST API.
 * Expects the local server database UUID in the JSON body: { serverId }.
 */
router.post("/sync-commands", requireAuth, async (req, res) => {
  const { serverId } = req.body

  if (!serverId) {
    res.status(400).json({
      error: {
        status: 400,
        message: "Bad Request: Missing serverId parameter"
      }
    })
    return
  }

  try {
    // Resolve the server verifying ownership
    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
        owner_id: req.user!.id
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

    const guildIdStr = server.discord_guild_id.toString()
    
    // Register commands via Discord REST API
    await DiscordService.syncGuildCommands(guildIdStr)

    res.json({
      success: true,
      message: "Slash commands synced successfully."
    })
  } catch (err: any) {
    console.error("❌ Guild command synchronization failed:", err)
    res.status(500).json({
      error: {
        status: 500,
        message: err.message || "Failed to sync command overrides with Discord"
      }
    })
  }
})

/**
 * POST /api/v1/discord/interactions
 * Webhook endpoint that receives incoming notifications from Discord.
 * Protected by Ed25519 signature checks.
 */
router.post("/interactions", verifyDiscordSignature, async (req, res) => {
  try {
    const { type } = req.body

    if (type === 1) { // PING
      res.json({ type: 1 })
      return
    }

    if (type === 2) { // APPLICATION_COMMAND
      const { name: commandName, options } = req.body.data || {}
      const hasTextOption = options?.some((o: any) => o.name === "text")
      const guildId = req.body.guild_id

      // If /report is executed without the text option, check config first
      if (commandName === "report" && !hasTextOption) {
        if (guildId) {
          try {
            const server = await prisma.server.findUnique({
              where: { discord_guild_id: BigInt(guildId) },
              include: {
                command_configs: {
                  where: { command_name: "report" }
                }
              }
            })
            if (server) {
              const cmdConfig = server.command_configs?.[0]
              if (cmdConfig && !cmdConfig.enabled) {
                res.json({
                  type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
                  data: {
                    content: "⚠️ The `/report` command is currently disabled by the server administrator.",
                    flags: 64 // EPHEMERAL
                  }
                })
                return
              }
            }
          } catch (dbErr) {
            console.error("Database error while checking command status for modal:", dbErr)
          }
        }

        res.json({
          type: 9, // MODAL
          data: {
            title: "Submit Report",
            custom_id: "report_modal",
            components: [
              {
                type: 1, // Action Row
                components: [
                  {
                    type: 4, // Text Input
                    custom_id: "report_issue",
                    label: "Issue",
                    style: 1, // Short text input
                    min_length: 1,
                    max_length: 100,
                    placeholder: "Server lag, bug, feature request...",
                    required: true
                  }
                ]
              },
              {
                type: 1, // Action Row
                components: [
                  {
                    type: 4, // Text Input
                    custom_id: "report_details",
                    label: "Details",
                    style: 2, // Paragraph input
                    min_length: 1,
                    max_length: 2000,
                    placeholder: "Describe the issue in detail...",
                    required: true
                  }
                ]
              }
            ]
          }
        })
        return
      }

      // Otherwise, return deferred response immediately and process in the background
      const ackStart = Date.now()
      res.json({ type: 5 }) // Return deferred response immediately
      console.log(`⏱️ [${Date.now() - ackStart}ms] Deferred acknowledgement (type 5) sent to Discord`)

      // Run execution pipeline in the background
      CommandService.handleCommand(req.body).catch((err) => {
        console.error("❌ Background command execution failed:", err)
      })
      return
    }

    if (type === 5) { // MODAL_SUBMIT
      const ackStart = Date.now()
      res.json({ type: 5 }) // Return deferred response immediately to show "is thinking..."
      console.log(`⏱️ [${Date.now() - ackStart}ms] Deferred Modal acknowledgement (type 5) sent to Discord`)

      // Run execution pipeline in the background
      CommandService.handleCommand(req.body).catch((err) => {
        console.error("❌ Background modal command execution failed:", err)
      })
      return
    }

    res.json({
      type: 4,
      data: {
        content: "⚠️ Unhandled interaction type received."
      }
    })
  } catch (err: any) {
    console.error("❌ Webhook interaction execution failed:", err)
    if (!res.headersSent) {
      res.status(500).json({
        error: {
          status: 500,
          message: err.message || "Failed to process incoming interaction webhook"
        }
      })
    }
  }
})

export default router
