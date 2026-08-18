"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Pill, 
  Calendar, 
  FileText, 
  AlertCircle, 
  Printer, 
  CheckCircle2, 
  Image as ImageIcon,
  ZoomIn,
  ShieldCheck
} from "lucide-react";
import { ParentPrescriptionRecord } from "@/actions/portal";

interface PrescriptionViewModalProps {
  prescription: ParentPrescriptionRecord | null;
  patientName: string;
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PrescriptionViewModal({
  prescription,
  patientName,
  patientId,
  isOpen,
  onClose,
}: PrescriptionViewModalProps) {
  const [imageZoomed, setImageZoomed] = useState(false);

  if (!prescription) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <FileText className="h-4 w-4" />
              </span>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  Medical Report Details
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Prescribed on {prescription.dateString} • Patient: <strong className="text-slate-700">{patientName}</strong>
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 py-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Read-Only Record
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50"
                asChild
              >
                <a
                  href={`/api/portal/prescriptions/${prescription.id}/pdf?patientId=${patientId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / PDF
                </a>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Clinical Summary */}
          {prescription.aiSummary && (
            <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-1.5 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                Visit Summary
              </h4>
              <p className="text-sm text-slate-800 leading-relaxed font-normal">
                {prescription.aiSummary}
              </p>
            </div>
          )}

          {/* Prescribed Medications */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Pill className="h-4 w-4 text-blue-600" />
              Prescribed Medications ({prescription.medicines.length})
            </h4>

            {prescription.medicines.length > 0 ? (
              <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                    <tr>
                      <th className="py-3 px-4">Medicine Name</th>
                      <th className="py-3 px-4">Dosage</th>
                      <th className="py-3 px-4">Frequency & Timing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {prescription.medicines.map((med, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900 flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>{med.name}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <span className="inline-block bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-medium">
                            {med.dosage || 'As directed'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {med.frequency || 'Daily'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded-lg">
                No specific medicines extracted for this prescription.
              </p>
            )}
          </div>

          {/* Important Findings & Advice */}
          {prescription.importantFindings && prescription.importantFindings.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Important Instructions & Findings
              </h4>
              <div className="rounded-lg border border-amber-200/80 bg-amber-50/40 p-4 space-y-2">
                {prescription.importantFindings.map((finding, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-slate-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                    <span>{finding}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doctor Notes */}
          {prescription.doctorNotes && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-600" />
                Doctor's Clinical Notes
              </h4>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap">
                {prescription.doctorNotes}
              </div>
            </div>
          )}

          {/* Original Prescription Document Preview */}
          {prescription.imageUrl && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-slate-600" />
                  Original Prescription Image
                </h4>
                <button
                  type="button"
                  onClick={() => setImageZoomed(!imageZoomed)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <ZoomIn className="h-3 w-3" />
                  {imageZoomed ? 'Shrink Image' : 'Zoom Image'}
                </button>
              </div>

              <div
                className={`rounded-xl border border-slate-200 bg-slate-100 p-2 overflow-hidden flex items-center justify-center transition-all ${
                  imageZoomed ? 'max-h-[800px]' : 'max-h-[350px]'
                }`}
              >
                <img
                  src={prescription.imageUrl}
                  alt="Original Prescription"
                  className="object-contain w-full h-auto max-h-[750px] rounded-lg shadow-sm bg-white"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
