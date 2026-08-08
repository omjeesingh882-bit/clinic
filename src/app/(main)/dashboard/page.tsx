import { Suspense } from "react";
import Link from "next/link";
import { Users, FileText, Calendar, Upload, Plus, ChevronRight } from "lucide-react";
import { getDashboardStats } from "@/actions/dashboard";

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-white/50 border border-border/50"></div>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 h-96 rounded-2xl bg-white/50 border border-border/50"></div>
        <div className="h-96 rounded-2xl bg-white/50 border border-border/50"></div>
      </div>
    </div>
  );
}

async function DashboardContent() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border/50 transition-all hover:shadow-md group">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 transition-transform group-hover:scale-150 blur-2xl" />
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Total Patients</h3>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-4 text-3xl font-bold text-foreground">{stats.totalPatients.toLocaleString()}</p>
        </div>
        
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border/50 transition-all hover:shadow-md group">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-teal-500/10 transition-transform group-hover:scale-150 blur-2xl" />
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Total Prescriptions</h3>
            <FileText className="h-4 w-4 text-teal-500" />
          </div>
          <p className="mt-4 text-3xl font-bold text-foreground">{stats.totalPrescriptions.toLocaleString()}</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border/50 transition-all hover:shadow-md group">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/10 transition-transform group-hover:scale-150 blur-2xl" />
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">This Month</h3>
            <Calendar className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-4 text-3xl font-bold text-foreground">{stats.thisMonth.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Prescriptions */}
        <div className="md:col-span-2 rounded-2xl bg-white shadow-sm ring-1 ring-border/50 flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-border/40">
            <h2 className="text-lg font-semibold text-foreground tracking-tight">Recent Prescriptions</h2>
            <Link href="/search" className="text-sm font-medium text-primary hover:underline transition-all">
              View all
            </Link>
          </div>
          <div className="flex-1 p-2">
            <div className="space-y-1">
              {stats.recentPrescriptions.map((prescription) => (
                <Link
                  key={prescription.id}
                  href={`/prescriptions/${prescription.id}`}
                  className="group flex items-center justify-between rounded-xl p-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{prescription.patientName}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{prescription.summary}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="hidden sm:inline-block">{prescription.date}</span>
                    <ChevronRight className="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
              {stats.recentPrescriptions.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No prescriptions digitized yet. Click "Upload Prescription" to get started.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-border/50 p-6 flex flex-col gap-6">
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Quick Actions</h2>
          <div className="flex flex-col gap-3">
            <Link
              href="/upload"
              className="flex items-center gap-3 rounded-xl bg-primary px-4 py-4 text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                <Upload className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-base">Upload Prescription</span>
                <span className="text-xs text-primary-foreground/80 font-medium">Digitize a new record</span>
              </div>
            </Link>

            <Link
              href="/patients"
              className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-4 text-secondary-foreground transition-all hover:bg-secondary/80 active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/60 shadow-sm">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-base">View Patients</span>
                <span className="text-xs text-muted-foreground font-medium">Manage and add patient records</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your clinic's digitized prescriptions.</p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
