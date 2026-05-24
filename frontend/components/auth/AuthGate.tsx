"use client";

import { LoginPage } from "./LoginPage";
import { useAuth } from "@/hooks/useAuth";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { authenticated, loading } = useAuth();
  if (loading) return <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted">Checking GitHub session...</main>;
  if (!authenticated) return <LoginPage />;
  return <>{children}</>;
}
