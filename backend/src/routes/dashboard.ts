import { Router } from "express"
import { requireAuth } from "../middleware/auth"
import { prisma } from "../dependencies/prisma"

const router = Router()

/**
 * GET /api/v1/dashboard/summary
 * Returns a aggregated statistics overview and logs dashboard summary for the authenticated user.
 */
router.get("/summary", requireAuth, async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      error: {
        status: 401,
        message: "Unauthorized: Missing user context"
      }
    })
    return
  }

  try {
    const ownerId = req.user.id

    // 1. Count connected servers
    const connectedServers = await prisma.server.count({
      where: { owner_id: ownerId }
    })

    // 2. Count command configurations across all user's servers
    const registeredCommands = await prisma.commandConfig.count({
      where: {
        server: { owner_id: ownerId }
      }
    })

    // 3. Count interaction logs from today (00:00:00 local time)
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const todayInteractions = await prisma.interactionLog.count({
      where: {
        server: { owner_id: ownerId },
        created_at: { gte: startOfToday }
      }
    })

    // 4. Count active server configs with channel mirrors mapped
    const activeMirrors = await prisma.serverConfig.count({
      where: {
        server: { owner_id: ownerId },
        mirror_channel_id: { not: null }
      }
    })

    // 5. Fetch 5 most recent interaction logs
    const dbRecentInteractions = await prisma.interactionLog.findMany({
      where: {
        server: { owner_id: ownerId }
      },
      orderBy: { created_at: "desc" },
      take: 5,
      include: {
        server: true
      }
    })

    // 6. Fetch 5 most recent action logs
    const dbRecentActions = await prisma.actionLog.findMany({
      where: {
        interaction_log: {
          server: { owner_id: ownerId }
        }
      },
      orderBy: { created_at: "desc" },
      take: 5,
      include: {
        interaction_log: {
          include: {
            server: true
          }
        }
      }
    })

    // Format logs converting BigInt to string to satisfy JSON formatting
    const recentInteractions = dbRecentInteractions.map(log => ({
      id: log.id,
      interaction_id: log.interaction_id,
      server_id: log.server_id,
      server_name: log.server.name,
      discord_user_id: log.discord_user_id.toString(),
      command: log.command,
      arguments: log.arguments,
      status: log.status,
      ai_summary: log.ai_summary,
      created_at: log.created_at
    }))

    const recentActions = dbRecentActions.map(log => ({
      id: log.id,
      interaction_log_id: log.interaction_log_id,
      command: log.interaction_log.command,
      server_name: log.interaction_log.server.name,
      action_type: log.action_type,
      status: log.status,
      provider: log.provider,
      error_message: log.error_message,
      retry_count: log.retry_count,
      duration_ms: log.duration_ms,
      created_at: log.created_at
    }))

    res.json({
      connectedServers,
      registeredCommands,
      todayInteractions,
      activeMirrors,
      recentInteractions,
      recentActions
    })
  } catch (err: any) {
    console.error("Error generating dashboard summary:", err)
    res.status(500).json({
      error: {
        status: 500,
        message: err.message || "Failed to compile dashboard summary statistics"
      }
    })
  }
})

export default router
