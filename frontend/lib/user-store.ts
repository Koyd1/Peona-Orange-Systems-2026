import { hash, hashSync, compare } from "bcryptjs";

export type AppRole = "ADMIN" | "USER";

export type AppUser = {
  id: string;
  email: string;
  passwordHash: string;
  role: AppRole;
  createdAt: Date;
};

type UserStore = Map<string, AppUser>;

declare global {
  // eslint-disable-next-line no-var
  var __hrbot_user_store__: UserStore | undefined;
}

function getStore(): UserStore {
  if (!global.__hrbot_user_store__) {
    global.__hrbot_user_store__ = new Map<string, AppUser>();
    bootstrapAdmin(global.__hrbot_user_store__);
  }
  return global.__hrbot_user_store__;
}

function bootstrapAdmin(store: UserStore): void {
  const email = (process.env.ADMIN_EMAIL ?? "admin@hr.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "Admin123456!";

  if (store.has(email)) {
    return;
  }

  store.set(email, {
    id: crypto.randomUUID(),
    email,
    passwordHash: hashSync(password, 10),
    role: "ADMIN",
    createdAt: new Date()
  });
}

export async function registerUser(input: {
  email: string;
  password: string;
  role?: AppRole;
}): Promise<AppUser> {
  const store = getStore();
  const email = input.email.trim().toLowerCase();

  if (store.has(email)) {
    throw new Error("USER_EXISTS");
  }

  const user: AppUser = {
    id: crypto.randomUUID(),
    email,
    passwordHash: await hash(input.password, 10),
    role: input.role ?? "USER",
    createdAt: new Date()
  };

  store.set(email, user);
  return user;
}

export async function verifyUserPassword(
  user: AppUser,
  password: string
): Promise<boolean> {
  return compare(password, user.passwordHash);
}

export async function findUserByEmail(email: string): Promise<AppUser | null> {
  const store = getStore();
  return store.get(email.trim().toLowerCase()) ?? null;
}
