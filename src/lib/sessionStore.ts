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
  private instanceId = Math.random().toString(36).substring(7);

  constructor() {
    console.log(`[SessionStore] New instance created: ${this.instanceId}`);
  }

  get(id: string): SharedSession | undefined {
    const session = this.sessions.get(id);
    console.log(`[SessionStore:${this.instanceId}] GET ${id} - found: ${!!session}, total sessions: ${this.sessions.size}`);
    if (session && Date.now() - session.createdAt > SESSION_TTL_MS) {
      console.log(`[SessionStore:${this.instanceId}] Session ${id} expired (age: ${Date.now() - session.createdAt}ms)`);
      this.sessions.delete(id);
      return undefined;
    }
    return session;
  }

  set(id: string, session: SharedSession): void {
    console.log(`[SessionStore:${this.instanceId}] SET ${id}, total sessions: ${this.sessions.size + 1}`);
    this.sessions.set(id, session);
  }

  delete(id: string): boolean {
    console.log(`[SessionStore:${this.instanceId}] DELETE ${id}`);
    return this.sessions.delete(id);
  }
}

// Singleton instance
export const sessionStore = new SessionStore();
