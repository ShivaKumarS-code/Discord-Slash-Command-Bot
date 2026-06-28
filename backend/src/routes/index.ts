import { Router } from "express"
import authRouter from "./auth"
import discordRouter from "./discord"
import serversRouter from "./servers"
import dashboardRouter from "./dashboard"

const router = Router()

// Register Sub-Routers
router.use("/auth", authRouter)
router.use("/discord", discordRouter)
router.use("/servers", serversRouter)
router.use("/dashboard", dashboardRouter)

export default router
