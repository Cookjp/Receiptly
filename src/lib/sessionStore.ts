import { ReceiptData } from '@/services/receiptParser/ReceiptParserService';
import { Person, ItemAttribution } from '@/contexts/ReceiptContext';

export interface SharedSession {
  id: string;
  receipt: ReceiptData;
  people: Person[];
  attributions: ItemAttribution[];
  createdAt: number;
  updatedAt: number;
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

class SessionStore {
  private sessions: Map<string, SharedSession> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  get(id: string): SharedSession | undefined {
    const session = this.sessions.get(id);
    if (session && Date.now() - session.createdAt > SESSION_TTL_MS) {
      this.sessions.delete(id);
      return undefined;
    }
    return session;
  }

  set(id: string, session: SharedSession): void {
    this.sessions.set(id, session);
  }

  delete(id: string): boolean {
    return this.sessions.delete(id);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.createdAt > SESSION_TTL_MS) {
        this.sessions.delete(id);
      }
    }
  }
}

// Singleton instance
export const sessionStore = new SessionStore();
