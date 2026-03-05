const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export type AppSession = {
  id: string;
  userId: string;
  persistent: boolean;
  expiresAt: Date;
  terminatedAt?: Date;
};

type SessionStore = Map<string, AppSession>;

declare global {
  // eslint-disable-next-line no-var
  var __hrbot_session_store__: SessionStore | undefined;
}

function getStore(): SessionStore {
  if (!global.__hrbot_session_store__) {
    global.__hrbot_session_store__ = new Map<string, AppSession>();
  }
  return global.__hrbot_session_store__;
}

export function createAppSession(userId: string, persistent = true): AppSession {
  const session: AppSession = {
    id: crypto.randomUUID(),
    userId,
    persistent,
    expiresAt: new Date(Date.now() + SIX_HOURS_MS)
  };

  getStore().set(session.id, session);
  return session;
}

export function terminateSession(sessionId: string): void {
  const store = getStore();
  const found = store.get(sessionId);
  if (!found) return;

  found.terminatedAt = new Date();
  store.set(sessionId, found);
}

export function isSessionActive(sessionId: string): boolean {
  const found = getStore().get(sessionId);
  if (!found) return false;
  if (found.terminatedAt) return false;
  if (found.expiresAt.getTime() <= Date.now()) return false;
  return true;
}

export function getSessionById(sessionId: string): AppSession | null {
  return getStore().get(sessionId) ?? null;
}
