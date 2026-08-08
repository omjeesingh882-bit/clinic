import { getPatients } from "@/actions/patients";
import { PatientCard } from "./patient-card";
import { PatientSearch } from "./patient-search";
import { Users } from "lucide-react";

interface PatientListProps {
  search?: string;
}

export async function PatientList({ search }: PatientListProps) {
  const patients = await getPatients(search);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <PatientSearch />
        <div className="text-sm text-slate-500 font-medium">
          Showing {patients.length} {patients.length === 1 ? "patient" : "patients"}
        </div>
      </div>

      {patients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((patient: any) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white/50 rounded-xl border border-slate-200/60 shadow-sm backdrop-blur-sm">
          <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No patients found</h3>
          <p className="text-slate-500 max-w-sm">
            {search
              ? "We couldn't find any patients matching your search. Try different keywords."
              : "You haven't added any patients yet. Click 'Add Patient' to get started."}
          </p>
        </div>
      )}
    </div>
  );
}
