"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Role, User } from "@/lib/types";

export type PublicUser = Omit<User, "password">;

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: Role;
  firmName?: string;
  drugLicense?: string;
  gstNumber?: string;
  medicalRegNo?: string;
  city?: string;
  state?: string;
  turnoverBand?: string;
  businessType?: string;
}

interface AuthCtx {
  user: PublicUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  register: (u: RegisterInput) => Promise<string | null>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  ready: false,
  login: async () => null,
  logout: async () => {},
  register: async () => null,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refresh().finally(() => setReady(true));
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return data.error || "Login failed.";
    setUser(data.user);
    return null;
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  const register = async (u: RegisterInput): Promise<string | null> => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(u),
    });
    const data = await res.json();
    if (!res.ok) return data.error || "Registration failed.";
    setUser(data.user);
    return null;
  };

  return (
    <Ctx.Provider value={{ user, ready, login, logout, register, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
