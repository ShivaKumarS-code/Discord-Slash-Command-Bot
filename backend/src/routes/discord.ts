import { Router } from "express"
import DiscordService from "../services/discordService"
import { supabaseAdmin } from "../integrations/supabase"
import { prisma } from "../dependencies/prisma"

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
    res.redirect("http://localhost:3000/servers?connection=success")
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

export default router
