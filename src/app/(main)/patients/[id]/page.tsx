import { Suspense } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Calendar, 
  Edit2, 
  FileText, 
  Pill, 
  Star, 
  Upload, 
  User, 
  Phone
} from "lucide-react";
import { getPatientById } from "@/actions/patients";
import { getPrescriptionsByPatient } from "@/actions/prescriptions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PatientForm } from "@/components/patients/patient-form";
import { Skeleton } from "@/components/ui/skeleton";

interface PatientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 sm:px-6 space-y-8">
      <div className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors w-fit">
        <Link href="/patients" className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to Patients
        </Link>
      </div>

      <Suspense fallback={<PatientDetailSkeleton />}>
        <PatientDetailContent id={id} />
      </Suspense>
    </div>
  );
}

async function PatientDetailContent({ id }: { id: string }) {
  const [patient, prescriptions] = await Promise.all([
    getPatientById(id),
    getPrescriptionsByPatient(id),
  ]);

  if (!patient) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Patient not found</h2>
        <p className="text-slate-500 mt-2">The requested patient record does not exist.</p>
        <Button asChild className="mt-6 bg-blue-600 hover:bg-blue-700">
          <Link href="/patients">Return to Patients</Link>
        </Button>
      </div>
    );
  }

  const initials = patient.name.charAt(0).toUpperCase();

  return (
    <div className="space-y-8">
      {/* Patient Header Card */}
      <Card className="overflow-hidden border-slate-200/60 bg-white/50 shadow-sm backdrop-blur-sm">
        <div className="h-24 bg-gradient-to-r from-blue-100 to-blue-50/50"></div>
        <CardContent className="p-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 -mt-12">
            <div className="flex items-end gap-5">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md border border-slate-100 text-blue-600 font-bold text-4xl">
                {initials}
              </div>
              <div className="mb-1">
                <h1 className="text-3xl font-bold text-slate-900">{patient.name}</h1>
                <div className="flex flex-wrap items-center gap-3 text-slate-600 mt-2">
                  <span className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-md text-sm font-medium">
                    <User className="h-4 w-4 text-slate-400" />
                    {patient.age} yrs • {patient.gender}
                  </span>
                  {patient.phone && (
                    <span className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-md text-sm font-medium">
                      <Phone className="h-4 w-4 text-slate-400" />
                      {patient.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 sm:flex-none border-slate-200 hover:bg-slate-50 hover:text-slate-900">
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit Patient</DialogTitle>
                    <DialogDescription>Update the details for {patient.name}.</DialogDescription>
                  </DialogHeader>
                  <PatientForm mode="edit" defaultValues={patient} />
                </DialogContent>
              </Dialog>

              <Button asChild className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                <Link href={`/upload?patientId=${patient.id}`}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Prescription
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Prescription History</h2>
            <p className="text-slate-500 text-sm mt-1">
              {prescriptions.length} {prescriptions.length === 1 ? 'record' : 'records'} found
            </p>
          </div>
        </div>

        {prescriptions.length > 0 ? (
          <div className="relative border-l border-slate-200 ml-4 space-y-8 pb-4">
            {prescriptions.map((prescription: any) => (
              <div key={prescription.id} className="relative pl-8 group">
                <div className="absolute -left-[5px] top-1 h-[10px] w-[10px] rounded-full bg-slate-200 group-hover:bg-blue-500 group-hover:scale-125 transition-all group-hover:shadow-[0_0_0_4px_rgba(59,130,246,0.1)]" />
                
                <Link href={`/prescriptions/${prescription.id}`}>
                  <Card className="hover:shadow-md transition-all hover:border-blue-200/60 bg-white/50 backdrop-blur-sm cursor-pointer">
                    <CardHeader className="p-5 pb-3 flex flex-row items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {format(new Date(prescription.createdAt), "MMMM d, yyyy")}
                          {prescription.isImportant && (
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500 ml-1" />
                          )}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none">
                        <Pill className="mr-1.5 h-3.5 w-3.5" />
                        {prescription.medicineCount} Meds
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                      <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                        {prescription.summary ? (prescription.summary.length > 100 ? prescription.summary.substring(0, 100) + '...' : prescription.summary) : "No summary available for this prescription."}
                      </p>
                      {prescription.tags && prescription.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {prescription.tags.map((tag: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs font-medium text-slate-600 border-slate-200/60 bg-slate-50/50">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-slate-200 bg-slate-50/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-500">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No prescriptions yet</h3>
              <p className="text-slate-500 max-w-sm mb-6">
                This patient doesn't have any prescription records. Upload one to get started.
              </p>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href={`/upload?patientId=${id}`}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload First Prescription
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function PatientDetailSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-[220px] w-full rounded-xl" />
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-4 ml-4 border-l pl-8">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
