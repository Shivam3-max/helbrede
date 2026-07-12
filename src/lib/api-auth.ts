import { cookies } from "next/headers";
import { getSessionUser } from "./db";
import { User } from "./types";

export const SESSION_COOKIE = "hb_session";

export async function currentUser(): Promise<User | null> {
  const store = await cookies();
  return await getSessionUser(store.get(SESSION_COOKIE)?.value);
}

export function publicUser(u: User) {
  // never send password hashes/plaintext to the client
  const { password: _password, ...rest } = u;
  return rest;
}
