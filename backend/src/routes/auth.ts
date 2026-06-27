import { Router } from "express"
import { requireAuth } from "../middleware/auth"

const router = Router()

/**
 * GET /api/v1/auth/me
 * Returns credentials and database profile for the currently authenticated user.
 */
router.get("/me", requireAuth, (req, res) => {
  if (!req.user) {
    res.status(401).json({ 
      error: {
        status: 401,
        message: "Unauthorized: Request user context is not populated"
      } 
    })
    return
  }

  res.json({
    id: req.user.id,
    email: req.user.email,
    displayName: req.user.display_name
  })
})

export default router
