import { Router } from "express"
import authRouter from "./auth"
import discordRouter from "./discord"
import serversRouter from "./servers"
import dashboardRouter from "./dashboard"
import logsRouter from "./logs"

const router = Router()

// Register Sub-Routers
router.use("/auth", authRouter)
router.use("/discord", discordRouter)
router.use("/servers", serversRouter)
router.use("/dashboard", dashboardRouter)
router.use("/", logsRouter)

export default router
