import express from "express"
import cors from "cors"
import { env } from "./config/env"
import { requestLogger } from "./middleware/logger"
import { errorHandler } from "./middleware/errorHandler"
import apiRouter from "./routes"
import { DiscordBotService } from "./services/botService"

const app = express()

// Apply Global Middlewares
app.use(
  express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf
    }
  })
)
app.use(express.urlencoded({ extended: true }))

// Enable CORS
if (env.BACKEND_CORS_ORIGINS.length > 0) {
  app.use(
    cors({
      origin: env.BACKEND_CORS_ORIGINS,
      credentials: true
    })
  )
} else {
  app.use(cors())
}

// Request logging middleware
app.use(requestLogger)

// Register API Routes
app.use("/api/v1", apiRouter)

// Health Check Endpoint
app.get("/", (req, res) => {
  res.json({
    status: "healthy",
    project: "Express + TypeScript Monorepo Backend",
    version: "1.0.0"
  })
})

// Centralized Error Handling Middleware
app.use(errorHandler)

// Start Server
app.listen(env.PORT, () => {
  console.log(`🚀 Express server running in ${env.NODE_ENV} mode on port ${env.PORT}`)
  
  // Initialize Discord Bot Gateway Client Connection
  DiscordBotService.initialize()
})
