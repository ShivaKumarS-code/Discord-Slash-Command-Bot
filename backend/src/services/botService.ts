import { Client, GatewayIntentBits } from "discord.js"
import { env } from "../config/env"

/**
 * Service managing the Discord Bot Gateway Client connection.
 * Binds ready listeners, monitors disconnect/reconnect shard events, and validates tokens.
 */
export class DiscordBotService {
  private static client: Client | null = null

  /**
   * Initializes the client connection and logs into the Discord Gateway.
   */
  static initialize() {
    if (process.env.DISCORD_GATEWAY_ENABLED === "false") {
      console.info("ℹ️ Discord Bot running in stateless Webhook-only mode (Gateway Connection bypassed).")
      return
    }

    if (!env.DISCORD_BOT_TOKEN || env.DISCORD_BOT_TOKEN === "your-discord-bot-token") {
      console.warn("⚠️ Warning: DISCORD_BOT_TOKEN is not configured. Gateway connection bypassed.")
      return
    }

    // 1. Audit Token and Client ID alignment
    try {
      const tokenPrefix = env.DISCORD_BOT_TOKEN.split(".")[0]
      const decodedClientId = Buffer.from(tokenPrefix, "base64").toString("utf-8")
      
      if (decodedClientId !== env.DISCORD_CLIENT_ID) {
        console.warn(
          `⚠️ WARNING: Token Client ID mismatch detected!\n` +
          `- Decoded from Bot Token: "${decodedClientId}"\n` +
          `- Configured DISCORD_CLIENT_ID: "${env.DISCORD_CLIENT_ID}"\n` +
          `Please make sure your DISCORD_BOT_TOKEN matches the DISCORD_CLIENT_ID application.`
        )
      } else {
        console.info("🟢 Discord Bot Token credentials verified (Client ID matches).")
      }
    } catch (err) {
      console.warn("⚠️ Failed to parse Client ID from token for verification:", err)
    }

    // 2. Initialize Discord.js Client with minimum required intents (Guilds)
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds]
    })

    // 3. Register Gateway events
    this.client.on("clientReady", (readyClient) => {
      console.log(`🤖 Discord Bot logged in as ${readyClient.user.tag}!`)
      console.log(`🤖 Present in ${readyClient.guilds.cache.size} server guilds.`)
    })

    this.client.on("error", (error) => {
      console.error("❌ Discord Bot Gateway Connection Error:", error)
    })

    // 4. Log in
    this.client.login(env.DISCORD_BOT_TOKEN).catch((err) => {
      console.error("❌ Failed to log in Discord Bot Gateway Client:", err)
    })
  }

  /**
   * Retrieves the active Discord Client instance.
   */
  static getClient(): Client | null {
    return this.client
  }
}
export default DiscordBotService
