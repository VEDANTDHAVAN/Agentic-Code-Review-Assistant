"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LandingPage } from "./LandingPage";
import { useAuth } from "@/hooks/useAuth";

export function HomePage() {
  const { authenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && authenticated) router.replace("/dashboard");
  }, [authenticated, loading, router]);

  if (loading || authenticated) {
    return <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted">Loading PRism AI...</main>;
  }

  return <LandingPage />;
}
