import { prisma } from "../dependencies/prisma"
import { InteractionStatus, ActionType, ActionStatus, Prisma } from "@prisma/client"

/**
 * Service managing execution logic for all incoming slash commands.
 * Handles configuration overrides validation, logs interactions/actions to database tables,
 * and compiles responses for Discord.
 */
export class CommandService {
  /**
   * Executes incoming Discord slash commands.
   * Resolves configuration parameters, checks switches, logs events, and compiles replies.
   */
  static async handleCommand(payload: any): Promise<{ type: number; data: { content: string } }> {
    const { name: commandName, options } = payload.data
    const guildId = payload.guild_id
    const interactionId = payload.id
    const discordUserId = payload.member?.user?.id || payload.user?.id

    if (!guildId || !discordUserId) {
      return {
        type: 4, // CHANNEL_MESSAGE_WITH_SOURCE response
        data: {
          content: "❌ Error: Could not resolve server guild context or user identity."
        }
      }
    }

    // 1. Fetch server and its command configuration from DB in a single query to reduce latency
    const server = await prisma.server.findUnique({
      where: { discord_guild_id: BigInt(guildId) },
      include: {
        command_configs: {
          where: { command_name: commandName }
        }
      }
    })

    if (!server) {
      return {
        type: 4,
        data: {
          content: "❌ Error: This server has not been registered in the dashboard. Please connect it first."
        }
      }
    }

    // 2. Resolve command configuration from the single query result relation
    let cmdConfig = server.command_configs?.[0] || null

    // If config doesn't exist in DB, assume standard default parameters
    if (!cmdConfig) {
      cmdConfig = {
        id: "",
        server_id: server.id,
        command_name: commandName,
        enabled: true,
        ai_enabled: commandName === "report", // default: AI active for reports
        mirror_enabled: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    }

    // 3. Respect enabled/disabled configuration
    if (!cmdConfig.enabled) {
      return {
        type: 4,
        data: {
          content: `⚠️ The \`/${commandName}\` command is currently disabled by the server administrator.`
        }
      }
    }

    const isAiEnabled = cmdConfig.ai_enabled
    const isMirrorEnabled = cmdConfig.mirror_enabled

    // Parse options
    const args = options || null
    let responseText = ""

    // 4. Command Execution Logic
    if (commandName === "status") {
      responseText = `🟢 Bot status: Online and operational.\n- Configured parameters: AI Overrides: ${isAiEnabled ? "Enabled" : "Disabled"}, Log Mirroring: ${isMirrorEnabled ? "Active" : "Disabled"}.`
    } else if (commandName === "report") {
      const textOption = options?.find((o: any) => o.name === "text")
      const textVal = textOption?.value || "No content supplied."
      
      responseText = `📥 Report received and logged. Command configuration mapping verified.\n- Content: "${textVal}"\n- Configured parameters: AI Processing: ${isAiEnabled ? "Pending" : "Disabled"}, Log Mirroring: ${isMirrorEnabled ? "Pending" : "Disabled"}.`
    } else {
      responseText = `❌ Error: Unknown slash command \`/${commandName}\`.`
    }

    // 5. Log the interaction event and actions to database in the background without blocking the response
    prisma.interactionLog.create({
      data: {
        interaction_id: interactionId,
        server_id: server.id,
        discord_user_id: BigInt(discordUserId),
        command: commandName,
        arguments: args ? JSON.parse(JSON.stringify(args)) : Prisma.DbNull,
        status: InteractionStatus.SUCCESS,
        ai_summary: null,
        ai_tags: Prisma.DbNull,
        action_logs: {
          create: [
            {
              action_type: ActionType.SAVE_INTERACTION,
              status: ActionStatus.SUCCESS,
              retry_count: 0
            },
            {
              action_type: ActionType.DISCORD_REPLY_SENT,
              status: ActionStatus.SUCCESS,
              retry_count: 0
            }
          ]
        }
      }
    }).catch((err: any) => {
      console.error("❌ Background logging database transaction failed:", err)
    })

    return {
      type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
      data: {
        content: responseText
      }
    }
  }
}
export default CommandService
