"use client";

import React from "react";
import { UserPlus, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
}

interface PatientSelectorProps {
  patients: Patient[];
  selectedPatientId?: string;
  onSelect: (patientId: string) => void;
}

export function PatientSelector({ patients, selectedPatientId, onSelect }: PatientSelectorProps) {
  return (
    <div className="w-full max-w-md">
      <Select value={selectedPatientId} onValueChange={onSelect}>
        <SelectTrigger className="w-full h-12 text-base">
          <SelectValue placeholder="Search or select a patient..." />
        </SelectTrigger>
        <SelectContent>
          {patients.map((patient) => (
            <SelectItem key={patient.id} value={patient.id} className="py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-medium text-slate-900">{patient.name}</span>
                  <span className="text-xs text-slate-500">
                    {patient.age} yrs • {patient.gender}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
          {patients.length === 0 && (
            <div className="p-4 text-center text-sm text-slate-500">
              No patients found.
            </div>
          )}
          <SelectSeparator />
          <div className="p-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // In a real app, this would open a dialog or navigate to add patient
                console.log("Open add patient dialog");
              }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add New Patient
            </Button>
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}
