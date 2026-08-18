import React from "react";
import { requireAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <AppShell
      doctorName={session.doctorName}
      doctorEmail={session.doctorEmail}
    >
      {children}
    </AppShell>
  );
}
