"use client";

import React, { useState, useMemo } from "react";
import { Pill, Search, Calendar, Clock, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AggregatedMedicine } from "@/actions/portal";

interface MedicinesViewProps {
  medicines: AggregatedMedicine[];
  onSelectPrescription: (prescriptionId: string) => void;
}

export function MedicinesView({ medicines, onSelectPrescription }: MedicinesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMedicines = useMemo(() => {
    if (!searchTerm.trim()) return medicines;
    const term = searchTerm.toLowerCase().trim();
    return medicines.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.dosage.toLowerCase().includes(term) ||
        m.frequency.toLowerCase().includes(term)
    );
  }, [medicines, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Pill className="h-5 w-5 text-blue-600" />
            Prescribed Medicines
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Complete list of all medications prescribed for your child across visits.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search medicines or dosage..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white border-slate-200"
          />
        </div>
      </div>

      {filteredMedicines.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMedicines.map((med, index) => (
            <Card
              key={`${med.prescriptionId}-${index}`}
              className="border-slate-200/80 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all hover:border-blue-200"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-semibold">
                      <Pill className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 leading-tight">
                        {med.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-0.5">
                        {med.dosage}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="font-medium">Timing:</span>
                    <span>{med.frequency}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Prescribed on {med.prescribedDate}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => onSelectPrescription(med.prescriptionId)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    View Prescription Report →
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white/50">
          <Pill className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          <h3 className="text-base font-medium text-slate-800">
            {medicines.length === 0 ? "No medicines recorded yet" : "No matching medicines found"}
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {medicines.length === 0
              ? "Prescriptions uploaded by the clinic doctor will automatically list medicines here."
              : `No medicines matched "${searchTerm}". Try searching for another medicine name.`}
          </p>
        </div>
      )}
    </div>
  );
}
