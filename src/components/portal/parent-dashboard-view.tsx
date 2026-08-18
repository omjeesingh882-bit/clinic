"use client";

import React, { useState } from "react";
import { 
  ParentPatientRecord, 
  ParentPrescriptionRecord 
} from "@/actions/portal";
import { 
  User, 
  Phone, 
  Calendar, 
  FileText, 
  Pill, 
  LogOut, 
  ShieldCheck, 
  Printer, 
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  Stethoscope
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrescriptionViewModal } from "./prescription-view-modal";
import { MedicinesView } from "./medicines-view";
import { FindingsView } from "./findings-view";

interface ParentDashboardViewProps {
  patient: ParentPatientRecord;
  onExit: () => void;
}

export function ParentDashboardView({ patient, onExit }: ParentDashboardViewProps) {
  const [selectedPrescription, setSelectedPrescription] = useState<ParentPrescriptionRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("prescriptions");

  const handleOpenPrescription = (rx: ParentPrescriptionRecord) => {
    setSelectedPrescription(rx);
    setIsModalOpen(true);
  };

  const handleSelectPrescriptionById = (rxId: string) => {
    const rx = patient.prescriptions.find((p) => p.id === rxId);
    if (rx) {
      setSelectedPrescription(rx);
      setIsModalOpen(true);
    }
  };

  const latestVisit = patient.prescriptions.length > 0 ? patient.prescriptions[0].dateString : "N/A";
  const initials = patient.name.charAt(0).toUpperCase();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Patient Header Card */}
      <Card className="overflow-hidden border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="h-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700"></div>
        <CardContent className="p-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 -mt-10">
            <div className="flex items-end gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md border border-slate-100 text-blue-600 font-bold text-3xl">
                {initials}
              </div>
              <div className="mb-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    {patient.name}
                  </h1>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-xs py-0.5">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    Read-Only Portal
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-slate-600 mt-2 text-sm">
                  <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-0.5 rounded-md font-medium">
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    {patient.age} yrs • {patient.gender}
                  </span>
                  {patient.phone && (
                    <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-0.5 rounded-md font-medium">
                      <Phone className="h-3.5 w-3.5 text-slate-500" />
                      {patient.phone}
                    </span>
                  )}
                  {patient.doctorName && (
                    <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md font-medium">
                      <Stethoscope className="h-3.5 w-3.5 text-blue-600" />
                      Dr. {patient.doctorName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={onExit}
                className="w-full sm:w-auto gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                <LogOut className="h-4 w-4" />
                Exit / Switch Patient
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200/80 bg-white/80 backdrop-blur-sm shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Prescriptions
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {patient.prescriptions.length}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white/80 backdrop-blur-sm shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Prescribed Medicines
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {patient.allMedicines.length}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Pill className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white/80 backdrop-blur-sm shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Latest Visit Date
              </p>
              <p className="text-base font-bold text-slate-900 mt-1 truncate">
                {latestVisit}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Calendar className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="prescriptions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm font-medium">
            Reports & Visits
          </TabsTrigger>
          <TabsTrigger value="medicines" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm font-medium">
            Medicines ({patient.allMedicines.length})
          </TabsTrigger>
          <TabsTrigger value="findings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm font-medium">
            Doctor Notes
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Prescriptions & Reports */}
        <TabsContent value="prescriptions" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Visit Prescriptions & Reports</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Review digitized doctor prescriptions, clinical summaries, and medicines.
              </p>
            </div>
          </div>

          {patient.prescriptions.length > 0 ? (
            <div className="space-y-4">
              {patient.prescriptions.map((rx) => (
                <Card
                  key={rx.id}
                  className="border-slate-200/80 bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all overflow-hidden"
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Calendar className="h-4 w-4" />
                        </span>
                        <div>
                          <CardTitle className="text-base font-bold text-slate-900">
                            Prescription on {rx.dateString}
                          </CardTitle>
                          <CardDescription className="text-xs text-slate-500">
                            Digitized Medical Record
                          </CardDescription>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-medium">
                          <Pill className="mr-1 h-3 w-3" />
                          {rx.medicines.length} Meds
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 text-xs text-slate-700 hover:text-blue-700 hover:border-blue-300"
                          asChild
                        >
                          <a
                            href={`/api/portal/prescriptions/${rx.id}/pdf?patientId=${patient.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Printer className="h-3 w-3" />
                            Print / PDF
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 pt-1 space-y-3">
                    {rx.aiSummary && (
                      <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                        {rx.aiSummary}
                      </p>
                    )}

                    {/* Medicines preview chips */}
                    {rx.medicines.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {rx.medicines.map((m, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium"
                          >
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            {m.name} {m.dosage ? `(${m.dosage})` : ''}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end pt-2 border-t border-slate-100">
                      <Button
                        size="sm"
                        onClick={() => handleOpenPrescription(rx)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-8"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        View Full Medical Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center rounded-2xl border border-dashed border-slate-200 bg-white/50">
              <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No prescriptions found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                No prescription records have been uploaded for this patient yet. Once your doctor digitizes a prescription, it will appear here.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Medicines */}
        <TabsContent value="medicines">
          <MedicinesView
            medicines={patient.allMedicines}
            onSelectPrescription={handleSelectPrescriptionById}
          />
        </TabsContent>

        {/* Tab 3: Findings */}
        <TabsContent value="findings">
          <FindingsView
            prescriptions={patient.prescriptions}
            onSelectPrescription={handleSelectPrescriptionById}
          />
        </TabsContent>
      </Tabs>

      {/* Prescription View Modal */}
      <PrescriptionViewModal
        prescription={selectedPrescription}
        patientName={patient.name}
        patientId={patient.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
