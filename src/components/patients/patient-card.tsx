"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit2, Phone, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deletePatient } from "@/actions/patients";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PatientForm } from "./patient-form";

interface PatientCardProps {
  patient: {
    id: string;
    name: string;
    age: number;
    gender: string;
    phone?: string;
    prescriptionCount: number;
  };
}

export function PatientCard({ patient }: PatientCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const initials = patient.name.charAt(0).toUpperCase();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("id", patient.id);
      await deletePatient(formData);
      toast.success("Patient deleted successfully");
      setShowDeleteDialog(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete patient");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="group overflow-hidden rounded-xl border-slate-200/60 bg-white/50 shadow-sm transition-all hover:shadow-md hover:border-blue-200/60 backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <Link href={`/patients/${patient.id}`} className="flex items-center gap-4 flex-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-lg relative overflow-hidden group-hover:bg-blue-600 group-hover:text-white transition-colors">
              {initials}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-700 transition-colors">
                {patient.name}
              </h3>
              <p className="text-sm text-slate-500">
                {patient.age} yrs • {patient.gender}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Patient</DialogTitle>
                  <DialogDescription>
                    Update the details for {patient.name}.
                  </DialogDescription>
                </DialogHeader>
                <PatientForm
                  mode="edit"
                  defaultValues={patient}
                  onSuccess={() => setShowEditDialog(false)}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Patient</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete {patient.name}? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center text-sm text-slate-500 gap-1.5">
            {patient.phone ? (
              <>
                <Phone className="h-3.5 w-3.5" />
                <span>{patient.phone}</span>
              </>
            ) : (
              <span className="text-slate-400 italic">No phone added</span>
            )}
          </div>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none font-normal">
            {patient.prescriptionCount} Prescriptions
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
