import { Router } from "express"
import authRouter from "./auth"

const router = Router()

// Register Sub-Routers
router.use("/auth", authRouter)

export default router
