import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ClinicOCR - Authentication',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
