import { prisma } from "../dependencies/prisma"
import { InteractionStatus, ActionType, ActionStatus, Prisma } from "@prisma/client"
import { env } from "../config/env"
import AIService from "./aiService"
import DiscordMessageBuilder from "../utils/discordEmbeds"

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
    const isModal = payload.type === 5
    const commandName = isModal ? "report" : payload.data.name
    const options = payload.data?.options
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

    if (commandName === "about") {
      // Force /about command configuration: always enabled, no AI, no mirroring
      cmdConfig = {
        id: "",
        server_id: server.id,
        command_name: "about",
        enabled: true,
        ai_enabled: false,
        mirror_enabled: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    } else if (!cmdConfig) {
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

    // Parse arguments and construct normalized report parameters
    let issue = ""
    let details = ""
    let reportText = ""
    let originalReportBlock = ""
    let args: any[] = []

    if (isModal) {
      const components = payload.data?.components || []
      for (const row of components) {
        if (row.components) {
          for (const comp of row.components) {
            if (comp.custom_id === "report_issue") {
              issue = comp.value
            } else if (comp.custom_id === "report_details") {
              details = comp.value
            }
          }
        }
      }
      reportText = `Issue: ${issue}\nDetails: ${details}`
      originalReportBlock = `**Issue**: ${issue}\n**Details**: ${details}`
      args = [
        { name: "issue", value: issue },
        { name: "details", value: details }
      ]
    } else {
      args = options || []
      if (commandName === "report") {
        const textOption = args?.find((o: any) => o.name === "text")
        const textVal = textOption?.value || "No content supplied."
        reportText = textVal
        originalReportBlock = textVal
      }
    }

    try {
      let responseText = ""
      let aiSummary: string | null = null
      let discordPayload: string | { content?: string; embeds?: any[]; components?: any[] } = ""

      if (commandName === "status") {
        responseText = this.formatStatusResponse()
        discordPayload = responseText
      } else if (commandName === "about") {
        const aboutMsg = DiscordMessageBuilder.buildAboutResponse()
        discordPayload = aboutMsg
        responseText = "Returned bot details embed."
      } else if (commandName === "report") {
        if (isAiEnabled) {
          // Trigger Groq AI service call to summarize the reportText
          aiSummary = await AIService.summarizeReport(reportText)
          responseText = this.formatAiReportResponse(originalReportBlock, aiSummary)
        } else {
          responseText = this.formatStandardReportResponse(originalReportBlock)
        }
        discordPayload = responseText
      } else {
        responseText = `❌ Error: Unknown slash command \`/${commandName}\`.`
        discordPayload = responseText
      }

      // ALWAYS update the original deferred response using Discord webhooks API
      await this.updateDeferredResponse(interactionToken, discordPayload)

      // Trigger logging and mirroring
      this.runLoggingAndMirroringPipeline(
        interactionId,
        server,
        discordUserId,
        commandName,
        args,
        responseText,
        isMirrorEnabled,
        InteractionStatus.SUCCESS,
        aiSummary
      )
    } catch (err: any) {
      console.error("❌ Error executing command:", err)
      
      // Update Discord with the failure response
      try {
        await this.updateDeferredResponse(
          interactionToken,
          `❌ An error occurred executing the command: ${err.message || "Internal failure"}`
        )
      } catch (patchErr) {
        console.error("Failed to send error message back to Discord:", patchErr)
      }

      // Log failure state
      this.runLoggingAndMirroringPipeline(
        interactionId,
        server,
        discordUserId,
        commandName,
        args,
        `Error: ${err.message || "Internal failure"}`,
        isMirrorEnabled,
        InteractionStatus.FAILED,
        null
      )
    }
  }

  /**
   * Helper formatting status command responses.
   */
  private static formatStatusResponse(): string {
    return `🟢 **Bot Status**\n\nEverything is running normally.\n\n• Status: Online\n• Commands Available: 3`
  }

  /**
   * Helper formatting report responses without AI summaries.
   */
  private static formatStandardReportResponse(reportText: string): string {
    return `📥 **Report Received**\n\n**Original Report**\n${reportText}\n\nYour report has been successfully logged.`
  }

  /**
   * Helper formatting report responses with AI summaries.
   */
  private static formatAiReportResponse(reportText: string, aiSummary: string): string {
    return `🤖 **AI Summary**\n\n**Original Report**\n${reportText}\n\n**Summary**\n${aiSummary}\n\nYour report has been successfully logged.`
  }

  /**
   * Helper sending PATCH update to original deferred message.
   */
  private static async updateDeferredResponse(
    token: string,
    payload: string | { content?: string; embeds?: any[]; components?: any[] }
  ): Promise<void> {
    const patchUrl = `https://discord.com/api/v10/webhooks/${env.DISCORD_CLIENT_ID}/${token}/messages/@original`
    const body = typeof payload === "string" ? { content: payload } : payload

    const response = await fetch(patchUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
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
    status: InteractionStatus,
    aiSummary: string | null
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
          ai_summary: aiSummary,
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

      // 2. Perform log channel mirroring if enabled (bypass for status and about commands)
      const isLoggingEnabled = server.config?.logging_enabled ?? false
      const bypassMirror = commandName === "status" || commandName === "about"
      const mirrorChannelId = server.config?.mirror_channel_id ? server.config.mirror_channel_id.toString() : null

      if (isLoggingEnabled && isMirrorEnabled && !bypassMirror && mirrorChannelId) {
        // Run mirroring send asynchronously in the background
        await this.sendMirrorNotification(log.id, server.name, commandName, discordUserId, status, mirrorChannelId, args, aiSummary)
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
    args: any,
    aiSummary: string | null
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
        const issueOption = args.find((o: any) => o.name === "issue")
        const detailsOption = args.find((o: any) => o.name === "details")

        if (textOption) {
          fields.push({ name: "Reported Content", value: `"${textOption.value}"`, inline: false })
        } else if (issueOption || detailsOption) {
          if (issueOption) {
            fields.push({ name: "Reported Issue", value: `"${issueOption.value}"`, inline: false })
          }
          if (detailsOption) {
            fields.push({ name: "Report Details", value: `"${detailsOption.value}"`, inline: false })
          }
        } else {
          const formattedArgs = args.map((opt: any) => `${opt.name}: "${opt.value}"`).join("\n")
          if (formattedArgs) {
            fields.push({ name: "Arguments", value: formattedArgs, inline: false })
          }
        }
      }

      // Add AI Summary field if generated
      if (aiSummary) {
        fields.push({ name: "AI Summary", value: aiSummary, inline: false })
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
