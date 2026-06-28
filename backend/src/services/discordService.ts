import { PermissionsBitField } from "discord.js"
import { env } from "../config/env"

/**
 * Service managing all interactions with the Discord Developer API,
 * including OAuth authorization flows, guild lists, and bot installations.
 */
export class DiscordService {
  /**
   * Generates the Discord OAuth authorization URL.
   * Requests identify, guilds, bot client, and application command sync permissions.
   * Optionally accepts a state parameter to track initiating user context.
   */
  static getAuthorizationUrl(state?: string): string {
    const clientId = env.DISCORD_CLIENT_ID
    const redirectUri = encodeURIComponent(env.DISCORD_REDIRECT_URI)
    const scope = encodeURIComponent("identify guilds bot applications.commands")
    
    // Resolve the permission bitfield using official discord.js constants
    const permissionsBitfield = new PermissionsBitField([
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.EmbedLinks,
      PermissionsBitField.Flags.ReadMessageHistory,
    ])
    
    // Note: The permission bit for "Use Application Commands" is PermissionsBitField.Flags.UseApplicationCommands.
    // Including this bit in the URL is redundant because the 'applications.commands' scope 
    // already registers slash commands, and the permission is enabled for @everyone by default.
    // Omitting this bit results in the final decimal value 84992, which avoids Discord query
    // parsing/signed-overflow glitches that display unrelated administrative permissions.
    const permissionsStr = permissionsBitfield.bitfield.toString() // resolves to "84992"
    
    let url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&permissions=${permissionsStr}`
    
    if (state) {
      url += `&state=${encodeURIComponent(state)}`
    }
    
    return url
  }

  /**
   * Exchanges the temporary authorization code for access and refresh tokens.
   */
  static async exchangeCode(code: string): Promise<{
    access_token: string
    token_type: string
    expires_in: number
    refresh_token: string
    scope: string
    guild?: any
  }> {
    const response = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: env.DISCORD_REDIRECT_URI
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error_description || data.error || "Failed to exchange Discord authorization code")
    }

    return data
  }

  /**
   * Retrieves a list of servers (guilds) that the authenticated user belongs to.
   */
  static async getUserGuilds(accessToken: string): Promise<any[]> {
    const response = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to retrieve user Discord guilds")
    }

    return data
  }

  /**
   * Retrieves a list of servers (guilds) that the bot has been invited/installed into.
   */
  static async getBotGuilds(): Promise<any[]> {
    const response = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to retrieve bot Discord guilds")
    }

    return data
  }

  /**
   * Registers slash commands (/status and /report) for a specific Discord guild server.
   */
  static async syncGuildCommands(guildId: string): Promise<any> {
    const clientId = env.DISCORD_CLIENT_ID
    const botToken = env.DISCORD_BOT_TOKEN

    const commands = [
      {
        name: "status",
        description: "View active health status metrics of the bot."
      },
      {
        name: "about",
        description: "Learn more about this Discord bot and its creator."
      },
      {
        name: "report",
        description: "Generate a summary report of bot activity.",
        options: [
          {
            name: "text",
            description: "The report text input content.",
            type: 3, // String type
            required: false
          }
        ]
      }
    ]

    const response = await fetch(
      `https://discord.com/api/v10/applications/${clientId}/guilds/${guildId}/commands`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(commands)
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to sync guild slash commands with Discord API")
    }

    return data
  }
}
export default DiscordService
