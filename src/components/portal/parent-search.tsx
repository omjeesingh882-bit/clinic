"use client";

import React, { useState } from "react";
import { 
  Search, 
  User, 
  Phone, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  HeartHandshake, 
  ArrowRight,
  Stethoscope,
  CheckCircle2,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { searchParentPatient, ParentPatientRecord } from "@/actions/portal";

interface ParentSearchProps {
  onSelectPatient: (patient: ParentPatientRecord) => void;
}

export function ParentSearch({ onSelectPatient }: ParentSearchProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<ParentPatientRecord[] | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Please enter both the patient's name and registered phone number.");
      return;
    }

    setLoading(true);
    setError(null);
    setSearchResults(null);

    try {
      const result = await searchParentPatient(name, phone);

      if (result.success && result.patients.length > 0) {
        if (result.patients.length === 1) {
          // Exactly 1 patient matched -> Go straight to dashboard
          onSelectPatient(result.patients[0]);
        } else {
          // Multiple profiles matched (e.g. siblings with same name/phone)
          setSearchResults(result.patients);
        }
      } else {
        setError(
          result.error ||
            "No patient record found. Please verify the exact name and phone number as registered in the clinic."
        );
      }
    } catch (err: any) {
      console.error("Parent search error:", err);
      setError("An unexpected error occurred. Please try again or contact the clinic.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Hero Welcome Card */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 mb-2">
          <HeartHandshake className="h-7 w-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Patient & Parent Portal
        </h1>
        <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto">
          Secure, read-only access to your prescriptions, digitized reports, and medicines.
        </p>
      </div>

      <Card className="border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
              <Lock className="h-3.5 w-3.5" />
            </span>
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Lookup Medical Records
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Enter your exact name and phone number (no upper/lower case required).
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="patient-name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Patient / Child Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="patient-name"
                  type="text"
                  placeholder="e.g. Rahul Sharma or Priya"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-11 text-sm bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Uppercase or lowercase does not matter (e.g. "rahul", "Rahul", "RAHUL" all work).
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="patient-phone" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Registered Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="patient-phone"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 h-11 text-sm bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                  required
                  disabled={loading}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Spaces and dashes are accepted automatically.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Record Not Found</p>
                  <p>{error}</p>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md shadow-blue-600/20 text-sm gap-2 mt-2 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching Records...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Access Records
                </>
              )}
            </Button>
          </form>

          {/* Multiple matches selection */}
          {searchResults && searchResults.length > 1 && (
            <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Multiple records found for this phone number. Select patient:
              </p>
              <div className="space-y-2">
                {searchResults.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => onSelectPatient(patient)}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left group"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700">
                        {patient.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {patient.age} yrs • {patient.gender} • {patient.prescriptions.length} Prescriptions
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trust & Read-Only Notice */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>Direct Read-Only Portal • Your medical records are securely preserved</span>
      </div>
    </div>
  );
}
