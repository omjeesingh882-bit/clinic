import type { Metadata } from 'next';
import Link from 'next/link';
import { Stethoscope, ShieldCheck, HeartHandshake } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ClinicOCR - Patient & Parent Medical Portal',
  description: 'View your medical prescriptions, medicines, and clinical reports securely.',
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 flex flex-col">
      {/* Portal Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/portal" className="flex items-center gap-2.5 font-bold text-slate-900 hover:opacity-90 transition-opacity">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base sm:text-lg tracking-tight font-bold text-slate-900">ClinicOCR</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Parent Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Read-Only Portal</span>
            </div>
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-50 transition-all"
            >
              Doctor Login →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-8 px-4 sm:px-6">
        {children}
      </main>

      {/* Portal Footer */}
      <footer className="border-t border-slate-200/60 bg-white/50 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} ClinicOCR Patient & Parent Medical Portal. All records preserved strictly read-only.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <HeartHandshake className="h-3.5 w-3.5 text-rose-400" />
            <span>Healthcare digitized safely</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
