import { Suspense } from "react";
import { Plus } from "lucide-react";
import { PatientList } from "@/components/patients/patient-list";
import { PatientForm } from "@/components/patients/patient-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface PatientsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PatientsPage({ searchParams }: PatientsPageProps) {
  const resolvedParams = await searchParams;
  const search = typeof resolvedParams.search === "string" ? resolvedParams.search : undefined;

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 sm:px-6 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Patients</h1>
          <p className="text-slate-500 mt-1">Manage your patient records and prescriptions.</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
              <Plus className="mr-2 h-4 w-4" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
              <DialogDescription>
                Enter the patient's details below to create a new record.
              </DialogDescription>
            </DialogHeader>
            <PatientForm mode="create" />
          </DialogContent>
        </Dialog>
      </div>

      <Suspense fallback={<PatientsSkeleton />}>
        <PatientList search={search} />
      </Suspense>
    </div>
  );
}

function PatientsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-11 w-full max-w-md rounded-lg" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-[140px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
