"use client";

import React, { useState } from "react";
import { ParentSearch } from "@/components/portal/parent-search";
import { ParentDashboardView } from "@/components/portal/parent-dashboard-view";
import { ParentPatientRecord } from "@/actions/portal";

export default function ParentPortalPage() {
  const [selectedPatient, setSelectedPatient] = useState<ParentPatientRecord | null>(null);

  return (
    <div className="w-full">
      {selectedPatient ? (
        <ParentDashboardView
          patient={selectedPatient}
          onExit={() => setSelectedPatient(null)}
        />
      ) : (
        <div className="py-6">
          <ParentSearch onSelectPatient={(patient) => setSelectedPatient(patient)} />
        </div>
      )}
    </div>
  );
}
