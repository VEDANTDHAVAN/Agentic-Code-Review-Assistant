"use client";

import { AuthGate } from "@/components/auth/AuthGate";
import { AppShell } from "@/components/layout/AppShell";
import { AIProviderSettings } from "@/components/settings/AIProviderSettings";

export default function SettingsPage() {
  return (
    <AuthGate>
      <AppShell>
        <div className="p-4 md:p-6">
          <AIProviderSettings />
        </div>
      </AppShell>
    </AuthGate>
  );
}
