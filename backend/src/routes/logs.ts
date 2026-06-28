import { Router } from "express"
import { requireAuth } from "../middleware/auth"
import { prisma } from "../dependencies/prisma"
import { ActionType } from "@prisma/client"

const router = Router()

/**
 * GET /api/v1/interaction-logs
 * Retrieves a paginated list of interaction logs, optionally filtered by server, command, and interaction ID.
 */
router.get("/interaction-logs", requireAuth, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: { message: "Unauthorized" } })
    return
  }

  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const skip = (page - 1) * limit

  const serverId = req.query.serverId as string
  const command = req.query.command as string
  const interactionId = req.query.interactionId as string

  try {
    const whereClause: any = {
      server: {
        owner_id: req.user.id
      }
    }

    if (serverId) {
      whereClause.server_id = serverId
    }

    if (command) {
      whereClause.command = command
    }

    if (interactionId) {
      whereClause.interaction_id = {
        contains: interactionId,
        mode: "insensitive"
      }
    }

    const [total, logs] = await Promise.all([
      prisma.interactionLog.count({ where: whereClause }),
      prisma.interactionLog.findMany({
        where: whereClause,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: {
          server: true
        }
      })
    ])

    const formattedLogs = logs.map(log => ({
      id: log.id,
      interaction_id: log.interaction_id,
      server_name: log.server.name,
      server_id: log.server_id,
      discord_user_id: log.discord_user_id.toString(),
      command: log.command,
      arguments: log.arguments,
      status: log.status,
      ai_summary: log.ai_summary,
      created_at: log.created_at
    }))

    res.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      logs: formattedLogs
    })
  } catch (err: any) {
    console.error("Failed to query interaction logs:", err)
    res.status(500).json({ error: { message: err.message || "Failed to retrieve interaction logs" } })
  }
})

/**
 * GET /api/v1/action-logs
 * Retrieves a paginated list of action history logs, optionally filtered by server and action type.
 */
router.get("/action-logs", requireAuth, async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: { message: "Unauthorized" } })
    return
  }

  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const skip = (page - 1) * limit

  const serverId = req.query.serverId as string
  const actionType = req.query.actionType as string

  try {
    const whereClause: any = {
      interaction_log: {
        server: {
          owner_id: req.user.id
        }
      }
    }

    if (serverId) {
      whereClause.interaction_log = {
        server_id: serverId
      }
    }

    if (actionType) {
      whereClause.action_type = actionType as ActionType
    }

    const [total, logs] = await Promise.all([
      prisma.actionLog.count({ where: whereClause }),
      prisma.actionLog.findMany({
        where: whereClause,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: {
          interaction_log: {
            include: {
              server: true
            }
          }
        }
      })
    ])

    const formattedLogs = logs.map(log => ({
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
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      logs: formattedLogs
    })
  } catch (err: any) {
    console.error("Failed to query action logs:", err)
    res.status(500).json({ error: { message: err.message || "Failed to retrieve action history logs" } })
  }
})

export default router
