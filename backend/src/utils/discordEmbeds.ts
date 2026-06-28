import { env } from "../config/env"

/**
 * Helper class to build visually polished Discord messages.
 * Keeps embed and component structure isolated from core command handlers.
 */
export class DiscordMessageBuilder {
  /**
   * Generates the Discord message payload for the /about command.
   */
  static buildAboutResponse() {
    const repoUrl = env.GITHUB_REPO_URL
    const dashboardUrl = env.DASHBOARD_URL

    const description = [
      "A full-stack Discord automation bot built for a Full Stack Internship Assessment.",
      "",
      "─────────────────────",
      "",
      "✨ Features",
      "• Slash Commands",
      "• AI-powered Reports",
      "• Live Dashboard",
      "• Channel Mirroring",
      "• Interaction Logging",
      "",
      "─────────────────────",
      "",
      "Built by Shiva Kumar S",
      "Version 1.0.0"
    ].join("\n")

    const embed = {
      title: "🤖 Discord Slash Command Bot",
      description,
      color: 989098 // slate-900 accent color (#0F172A)
    }

    const components = [
      {
        type: 1, // Action Row
        components: [
          {
            type: 2, // Button
            style: 5, // Link Button
            label: "GitHub Repository",
            url: repoUrl,
            emoji: { name: "🔗" }
          },
          {
            type: 2, // Button
            style: 5, // Link Button
            label: "Dashboard",
            url: dashboardUrl,
            emoji: { name: "💻" }
          }
        ]
      }
    ]

    return {
      content: "",
      embeds: [embed],
      components
    }
  }
}
export default DiscordMessageBuilder
