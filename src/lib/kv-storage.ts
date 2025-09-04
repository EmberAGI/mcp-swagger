import { kv } from "@vercel/kv";

export interface SessionData {
  sessionId: string;
  url: string;
  transportType: string;
  createdAt: number;
  lastAccessed: number;
  isActive: boolean;
}

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
      const sessionData = await kv.get<SessionData>(key);

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
      await kv.set(key, sessionData, { ex: this.sessionTimeout / 1000 });

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

      await kv.set(key, fullSessionData, { ex: this.sessionTimeout / 1000 });
      console.log(`[KV] Session ${sessionId} stored successfully`);
    } catch (error) {
      console.error("[KV] Error setting session:", error);
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const key = this.getSessionKey(sessionId);
      await kv.del(key);
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
      const keys = await kv.keys(`${this.sessionPrefix}*`);
      return keys.map((key) => key.replace(this.sessionPrefix, ""));
    } catch (error) {
      console.error("[KV] Error listing sessions:", error);
      return [];
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    try {
      const sessions = await this.listSessions();
      const now = Date.now();

      for (const sessionId of sessions) {
        const session = await this.getSession(sessionId);
        if (!session) {
          // Session was already expired and deleted
          continue;
        }

        if (now - session.lastAccessed > this.sessionTimeout) {
          await this.deleteSession(sessionId);
        }
      }
    } catch (error) {
      console.error("[KV] Error cleaning up sessions:", error);
    }
  }
}

export const sessionManager = KVSessionManager.getInstance();
