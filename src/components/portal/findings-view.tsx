"use client";

import React from "react";
import { AlertCircle, FileText, Calendar, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ParentPrescriptionRecord } from "@/actions/portal";

interface FindingsViewProps {
  prescriptions: ParentPrescriptionRecord[];
  onSelectPrescription: (prescriptionId: string) => void;
}

export function FindingsView({ prescriptions, onSelectPrescription }: FindingsViewProps) {
  const visitsWithFindingsOrNotes = prescriptions.filter(
    (p) => (p.importantFindings && p.importantFindings.length > 0) || (p.doctorNotes && p.doctorNotes.trim())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          Clinical Findings & Doctor's Advice
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Important instructions, diagnostic findings, and dietary advice recorded by the doctor.
        </p>
      </div>

      {visitsWithFindingsOrNotes.length > 0 ? (
        <div className="space-y-4">
          {visitsWithFindingsOrNotes.map((rx) => (
            <Card key={rx.id} className="border-slate-200 bg-white shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-800">
                      Visit on {rx.dateString}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectPrescription(rx.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    View Full Prescription →
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {rx.importantFindings && rx.importantFindings.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                      Key Findings & Instructions
                    </h4>
                    <ul className="space-y-1.5 pl-2">
                      {rx.importantFindings.map((finding, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {rx.doctorNotes && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-slate-500" />
                      Doctor's Notes
                    </h4>
                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                      {rx.doctorNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white/50">
          <AlertCircle className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          <h3 className="text-base font-medium text-slate-800">No specific findings noted</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Clinical findings or special care instructions provided by your doctor will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
