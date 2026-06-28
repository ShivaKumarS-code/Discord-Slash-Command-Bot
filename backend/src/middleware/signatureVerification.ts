import { Request, Response, NextFunction } from "express"
import { verifyKey } from "discord-interactions"
import { env } from "../config/env"

/**
 * Middleware that verifies incoming Discord webhook requests
 * using Ed25519 signature checks with the application's Public Key.
 */
export async function verifyDiscordSignature(req: Request, res: Response, next: NextFunction) {
  const signature = req.headers["x-signature-ed25519"] as string
  const timestamp = req.headers["x-signature-timestamp"] as string

  if (!signature || !timestamp || !req.rawBody) {
    res.status(401).json({
      error: {
        status: 401,
        message: "Unauthorized: Missing signature verification headers or request body"
      }
    })
    return
  }

  // Verify the request signature using raw body buffer and public key
  const isVerified = await verifyKey(
    req.rawBody,
    signature,
    timestamp,
    env.DISCORD_PUBLIC_KEY
  )

  if (!isVerified) {
    res.status(401).json({
      error: {
        status: 401,
        message: "Unauthorized: Invalid request signature"
      }
    })
    return
  }

  next()
}
export default verifyDiscordSignature
