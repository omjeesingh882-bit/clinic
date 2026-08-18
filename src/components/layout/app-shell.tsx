import React from "react";
import { Sidebar } from "./sidebar";

interface AppShellProps {
  children: React.ReactNode;
  doctorName: string;
  doctorEmail: string;
}

export function AppShell({ children, doctorName, doctorEmail }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar doctorName={doctorName} doctorEmail={doctorEmail} />
      <div className="flex-1 sm:pl-[280px] flex flex-col min-h-screen overflow-hidden">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-white/60 px-6 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground tracking-wide">
              App Overview
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{doctorName}</p>
              <p className="text-xs text-muted-foreground">{doctorEmail}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
              {doctorName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
