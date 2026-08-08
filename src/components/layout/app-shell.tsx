import React from "react";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <div className="flex-1 sm:pl-[280px] flex flex-col min-h-screen overflow-hidden">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-white/60 px-6 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground tracking-wide">
              App Overview
            </span>
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
