interface CachedUser {
  id: string
  supabase_user_id: string
  email: string
  display_name: string | null
}

interface CacheEntry {
  user: CachedUser
  expiresAt: number
}

class AuthCache {
  private cache = new Map<string, CacheEntry>()
  private ttlMs: number

  constructor(ttlSeconds = 30) {
    this.ttlMs = ttlSeconds * 1000
  }

  get(token: string): CachedUser | null {
    const entry = this.cache.get(token)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(token)
      return null
    }

    return entry.user
  }

  set(token: string, user: CachedUser): void {
    if (this.cache.size > 1000) {
      this.cache.clear()
    }
    this.cache.set(token, {
      user,
      expiresAt: Date.now() + this.ttlMs
    })
  }

  clear(): void {
    this.cache.clear()
  }
}

export const authCache = new AuthCache(30)
