const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const EXTEND_BY_MS = 2 * 60 * 60 * 1000;

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

export function setSessionPersistent(sessionId: string, persistent: boolean): AppSession | null {
  const store = getStore();
  const found = store.get(sessionId);
  if (!found) return null;

  found.persistent = persistent;
  store.set(sessionId, found);
  return found;
}

export function getSessionRemainingMs(sessionId: string): number {
  const found = getStore().get(sessionId);
  if (!found) return 0;
  return found.expiresAt.getTime() - Date.now();
}

export function extendSessionIfNeeded(sessionId: string): AppSession | null {
  const store = getStore();
  const found = store.get(sessionId);
  if (!found) return null;
  if (found.terminatedAt) return found;

  if (!found.persistent) {
    return found;
  }

  const remaining = found.expiresAt.getTime() - Date.now();
  if (remaining < ONE_HOUR_MS) {
    found.expiresAt = new Date(found.expiresAt.getTime() + EXTEND_BY_MS);
    store.set(sessionId, found);
  }

  return found;
}
