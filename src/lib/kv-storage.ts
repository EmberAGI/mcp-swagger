import { Redis } from "@upstash/redis";

export interface SessionData {
  sessionId: string;
  url: string;
  transportType: string;
  createdAt: number;
  lastAccessed: number;
  isActive: boolean;
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

export class KVSessionManager {
  private static instance: KVSessionManager;
  private sessionPrefix = "mcp-session:";
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes

  static getInstance(): KVSessionManager {
    if (!KVSessionManager.instance) {
      KVSessionManager.instance = new KVSessionManager();
    }
    return KVSessionManager.instance;
  }

  private getSessionKey(sessionId: string): string {
    return `${this.sessionPrefix}${sessionId}`;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const key = this.getSessionKey(sessionId);
      const sessionData = await redis.get<SessionData>(key);

      if (!sessionData) {
        return null;
      }

      // Check if session has expired
      const now = Date.now();
      if (now - sessionData.lastAccessed > this.sessionTimeout) {
        await this.deleteSession(sessionId);
        return null;
      }

      // Update last accessed time and TTL
      sessionData.lastAccessed = now;
      await redis.set(key, sessionData, {
        ex: Math.floor(this.sessionTimeout / 1000),
      });

      return sessionData;
    } catch (error) {
      console.error("[KV] Error getting session:", error);
      return null;
    }
  }

  async setSession(
    sessionId: string,
    sessionData: Partial<SessionData>
  ): Promise<void> {
    try {
      const key = this.getSessionKey(sessionId);
      const now = Date.now();

      const fullSessionData: SessionData = {
        sessionId: sessionData.sessionId || "",
        url: sessionData.url || "",
        transportType: sessionData.transportType || "streamable-http",
        createdAt: sessionData.createdAt || now,
        lastAccessed: now,
        isActive:
          sessionData.isActive !== undefined ? sessionData.isActive : true,
      };

      await redis.set(key, fullSessionData, {
        ex: Math.floor(this.sessionTimeout / 1000),
      });
      console.log(`[KV] Session ${sessionId} stored successfully`);
    } catch (error) {
      console.error("[KV] Error setting session:", error);
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const key = this.getSessionKey(sessionId);
      await redis.del(key);
      console.log(`[KV] Session ${sessionId} deleted successfully`);
    } catch (error) {
      console.error("[KV] Error deleting session:", error);
    }
  }

  async updateSession(
    sessionId: string,
    updates: Partial<SessionData>
  ): Promise<void> {
    try {
      const existingSession = await this.getSession(sessionId);
      if (!existingSession) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const updatedSession: SessionData = {
        ...existingSession,
        ...updates,
        lastAccessed: Date.now(),
      };

      await this.setSession(sessionId, updatedSession);
    } catch (error) {
      console.error("[KV] Error updating session:", error);
      throw error;
    }
  }

  async listSessions(): Promise<string[]> {
    try {
      // Upstash doesn't support KEYS over REST; we can track IDs separately if needed.
      // For now, return empty to avoid expensive scans.
      return [];
    } catch (error) {
      console.error("[KV] Error listing sessions:", error);
      return [];
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    // No-op for now without key scanning; TTLs handle expiry.
    return;
  }
}

export const sessionManager = KVSessionManager.getInstance();
