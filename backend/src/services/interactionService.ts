import { InteractionType, InteractionResponseType } from "discord-interactions"
import CommandService from "./commandService"

/**
 * Service managing incoming Discord interactions routing.
 * Parses the interaction type and directs command execution.
 */
export class InteractionService {
  /**
   * Processes the raw interaction payload and returns the payload to send back to Discord.
   */
  static async processInteraction(payload: any): Promise<any> {
    const { type } = payload

    // 1. Handle Ping requests
    if (type === InteractionType.PING) {
      return {
        type: InteractionResponseType.PONG
      }
    }

    // 2. Handle Application Command requests
    if (type === InteractionType.APPLICATION_COMMAND) {
      return await CommandService.handleCommand(payload)
    }

    // 3. Fallback for unhandled types
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "⚠️ Unhandled interaction type received."
      }
    }
  }
}
export default InteractionService
