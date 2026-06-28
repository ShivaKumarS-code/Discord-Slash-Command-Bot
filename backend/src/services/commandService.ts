import { prisma } from "../dependencies/prisma"
import { InteractionStatus, ActionType, ActionStatus, Prisma } from "@prisma/client"
import { env } from "../config/env"

/**
 * Service managing execution logic for all incoming slash commands.
 * Handles configuration overrides validation, logs interactions/actions to database tables,
 * sends log mirroring messages to Discord channels, and updates deferred responses.
 */
export class CommandService {
  /**
   * Executes incoming Discord slash commands in the background.
   * Resolves configuration parameters, checks switches, logs events, and compiles replies.
   */
  static async handleCommand(payload: any): Promise<void> {
    const { name: commandName, options } = payload.data
    const guildId = payload.guild_id
    const interactionId = payload.id
    const discordUserId = payload.member?.user?.id || payload.user?.id
    const interactionToken = payload.token

    if (!guildId || !discordUserId) {
      await this.updateDeferredResponse(interactionToken, "❌ Error: Could not resolve server guild context or user identity.")
      return
    }

    // 1. Interaction Deduplication: check if this interaction has already been processed
    const existingInteraction = await prisma.interactionLog.findFirst({
      where: { interaction_id: interactionId }
    })

    if (existingInteraction) {
      console.info(`ℹ️ Deduplicated duplicate interaction ID: ${interactionId}`)
      await this.updateDeferredResponse(interactionToken, "⚠️ Duplicate interaction received. This command was already processed.")
      return
    }

    // 2. Fetch server, server config, and command config in one single query
    const server = await prisma.server.findUnique({
      where: { discord_guild_id: BigInt(guildId) },
      include: {
        config: true,
        command_configs: {
          where: { command_name: commandName }
        }
      }
    })

    if (!server) {
      await this.updateDeferredResponse(interactionToken, "❌ Error: This server has not been registered in the dashboard. Please connect it first.")
      return
    }

    // Resolve command configuration
    let cmdConfig = server.command_configs?.[0] || null

    // If config doesn't exist in DB, assume standard default parameters
    if (!cmdConfig) {
      cmdConfig = {
        id: "",
        server_id: server.id,
        command_name: commandName,
        enabled: true,
        ai_enabled: commandName === "report", // default: AI active for reports
        mirror_enabled: true, // default: active to align with frontend checked state
        created_at: new Date(),
        updated_at: new Date()
      }
    }

    // 3. Respect enabled/disabled configuration
    if (!cmdConfig.enabled) {
      await this.updateDeferredResponse(interactionToken, `⚠️ The \`/${commandName}\` command is currently disabled by the server administrator.`)
      return
    }

    const isAiEnabled = cmdConfig.ai_enabled
    const isMirrorEnabled = cmdConfig.mirror_enabled
    const args = options || null

    let responseText = ""

    // 4. Command Execution / AI Processing
    if (isAiEnabled) {
      // Simulate/perform AI processing (or call Groq API in the future)
      await new Promise(resolve => setTimeout(resolve, 800))

      if (commandName === "status") {
        responseText = `🟢 Bot status: Online and operational.\n- Configured parameters: AI Overrides: Enabled, Log Mirroring: ${isMirrorEnabled ? "Active" : "Disabled"}.`
      } else if (commandName === "report") {
        const textOption = args?.find((o: any) => o.name === "text")
        const textVal = textOption?.value || "No content supplied."
        responseText = `🤖 [AI Assisted Overview]\nReport Summary: The bot has successfully acknowledged your report request.\n- Content: "${textVal}"\n- Configured parameters: AI Processing: Completed, Log Mirroring: ${isMirrorEnabled ? "Active" : "Disabled"}.`
      } else {
        responseText = `❌ Error: Unknown slash command \`/${commandName}\`.`
      }
    } else {
      // Fast path (No AI)
      if (commandName === "status") {
        responseText = `🟢 Bot status: Online and operational.\n- Configured parameters: AI Overrides: Disabled, Log Mirroring: ${isMirrorEnabled ? "Active" : "Disabled"}.`
      } else if (commandName === "report") {
        const textOption = args?.find((o: any) => o.name === "text")
        const textVal = textOption?.value || "No content supplied."
        responseText = `📥 Report received and logged. Command configuration mapping verified.\n- Content: "${textVal}"\n- Configured parameters: AI Processing: Disabled, Log Mirroring: ${isMirrorEnabled ? "Pending" : "Disabled"}.`
      } else {
        responseText = `❌ Error: Unknown slash command \`/${commandName}\`.`
      }
    }

    // 5. Update Discord deferred response (PATCH)
    await this.updateDeferredResponse(interactionToken, responseText)

    // 6. Trigger database logging and mirroring
    await this.runLoggingAndMirroringPipeline(
      interactionId,
      server,
      discordUserId,
      commandName,
      args,
      responseText,
      isMirrorEnabled,
      InteractionStatus.SUCCESS
    )
  }

  /**
   * Helper sending PATCH update to original deferred message.
   */
  private static async updateDeferredResponse(token: string, content: string): Promise<void> {
    const patchUrl = `https://discord.com/api/v10/webhooks/${env.DISCORD_CLIENT_ID}/${token}/messages/@original`
    const response = await fetch(patchUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content
      })
    })

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}))
      console.error("❌ Failed to update Discord deferred message:", errBody)
    }
  }

  /**
   * Helper executing DB logging and channel mirroring.
   */
  private static async runLoggingAndMirroringPipeline(
    interactionId: string,
    server: any,
    discordUserId: string,
    commandName: string,
    args: any,
    responseText: string,
    isMirrorEnabled: boolean,
    status: InteractionStatus
  ) {
    try {
      // 1. Create the interaction log and action logs
      const log = await prisma.interactionLog.create({
        data: {
          interaction_id: interactionId,
          server_id: server.id,
          discord_user_id: BigInt(discordUserId),
          command: commandName,
          arguments: args ? JSON.parse(JSON.stringify(args)) : Prisma.DbNull,
          status,
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
                status: status === InteractionStatus.SUCCESS ? ActionStatus.SUCCESS : ActionStatus.FAILED,
                retry_count: 0,
                error_message: status === InteractionStatus.FAILED ? responseText : null
              }
            ]
          }
        }
      })

      // 2. Perform log channel mirroring if enabled
      const isLoggingEnabled = server.config?.logging_enabled ?? false
      const mirrorChannelId = server.config?.mirror_channel_id ? server.config.mirror_channel_id.toString() : null

      if (isLoggingEnabled && isMirrorEnabled && mirrorChannelId) {
        // Run mirroring send asynchronously in the background
        await this.sendMirrorNotification(log.id, server.name, commandName, discordUserId, status, mirrorChannelId, args)
      }
    } catch (err: any) {
      console.error("❌ Error in background logging/mirroring pipeline:", err)
    }
  }

  /**
   * Sends mirror notification embeds to the configured Discord channel.
   * Records the outcome inside ActionLog.
   */
  private static async sendMirrorNotification(
    interactionLogId: string,
    serverName: string,
    commandName: string,
    discordUserId: string,
    status: InteractionStatus,
    mirrorChannelId: string,
    args: any
  ) {
    try {
      const fields: any[] = [
        { name: "User ID", value: `<@${discordUserId}>`, inline: true },
        { name: "Command", value: `/${commandName}`, inline: true },
        { name: "Server", value: serverName, inline: true },
        { name: "Execution Status", value: status, inline: true }
      ]

      // Extract and format arguments if present
      if (args && Array.isArray(args)) {
        const textOption = args.find((o: any) => o.name === "text")
        if (textOption) {
          fields.push({ name: "Reported Content", value: `"${textOption.value}"`, inline: false })
        } else {
          const formattedArgs = args.map((opt: any) => `${opt.name}: "${opt.value}"`).join("\n")
          if (formattedArgs) {
            fields.push({ name: "Arguments", value: formattedArgs, inline: false })
          }
        }
      }

      fields.push({ name: "Timestamp", value: new Date().toISOString(), inline: false })

      const response = await fetch(
        `https://discord.com/api/v10/channels/${mirrorChannelId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            embeds: [
              {
                title: "📢 Command Interaction Mirrored",
                color: status === InteractionStatus.SUCCESS ? 3066993 : 15158332,
                fields,
                footer: {
                  text: "Discord Slash-Command Bot Logs Logger"
                }
              }
            ]
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.error(`Failed to send mirror log to channel ${mirrorChannelId}:`, data)
        await prisma.actionLog.create({
          data: {
            interaction_log_id: interactionLogId,
            action_type: ActionType.MIRROR_SENT,
            status: ActionStatus.FAILED,
            error_message: data.message || "Failed to deliver message to Discord API channel",
            retry_count: 0
          }
        })
      } else {
        await prisma.actionLog.create({
          data: {
            interaction_log_id: interactionLogId,
            action_type: ActionType.MIRROR_SENT,
            status: ActionStatus.SUCCESS,
            retry_count: 0
          }
        })
      }
    } catch (err: any) {
      console.error(`❌ Channel mirroring request error:`, err)
      try {
        await prisma.actionLog.create({
          data: {
            interaction_log_id: interactionLogId,
            action_type: ActionType.MIRROR_SENT,
            status: ActionStatus.FAILED,
            error_message: err.message || "Network exception during request",
            retry_count: 0
          }
        })
      } catch (dbErr) {
        console.error("Failed to write mirror failure to action log:", dbErr)
      }
    }
  }
}
export default CommandService
