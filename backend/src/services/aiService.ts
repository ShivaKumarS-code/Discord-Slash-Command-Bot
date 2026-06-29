import { env } from "../config/env"

/**
 * Service managing AI generation requests.
 * Uses Groq completions API to generate summaries of user reports.
 * Falls back gracefully to static templates if keys or calls fail.
 */
export class AIService {
  /**
   * Generates a concise summary for a user report using Groq completions.
   */
  static async summarizeReport(text: string): Promise<string> {
    const apiKey = env.GROQ_API_KEY

    // Fallback if no valid key is configured
    if (!apiKey || apiKey === "your-groq-api-key") {
      console.warn("⚠️ Warning: GROQ_API_KEY is not configured. Falling back to default summary.")
      return this.generateFallbackSummary(text)
    }

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: "You are assisting a Discord moderation bot.\n\nSummarize the following user report in one concise sentence.\n\nReturn only the summary."
            },
            {
              role: "user",
              content: text
            }
          ],
          temperature: 0.2,
          max_tokens: 100
        })
      })

      const data = await response.json()

      if (!response.ok) {
        const errMsg = `Groq API completions request failed: ${JSON.stringify(data)}`
        console.error(`❌ ${errMsg}`)
        throw new Error(errMsg)
      }

      const summary = data.choices?.[0]?.message?.content?.trim()
      if (!summary) {
        const errMsg = "Empty summary response from Groq completions API"
        console.error(`❌ ${errMsg}`)
        throw new Error(errMsg)
      }

      return summary
    } catch (err: any) {
      console.error("❌ Exception during Groq AI summarization call:", err)
      throw err
    }
  }

  /**
   * Builds a static template-based summary fallback when the AI service is offline.
   */
  private static generateFallbackSummary(text: string): string {
    const trimmed = text.length > 60 ? `${text.slice(0, 57)}...` : text
    return `User submitted a report containing: "${trimmed}"`
  }
}
export default AIService
