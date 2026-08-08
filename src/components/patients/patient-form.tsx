"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPatient, updatePatient } from "@/actions/patients";
import { cn } from "@/lib/utils";

const patientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().min(0, "Age must be a positive number"),
  gender: z.enum(["Male", "Female", "Other"]),
  phone: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientFormProps {
  mode?: "create" | "edit";
  defaultValues?: {
    id?: string;
    name?: string;
    age?: number;
    gender?: string;
    phone?: string | null;
  };
  onSuccess?: () => void;
  className?: string;
}

export function PatientForm({ mode = "create", defaultValues, onSuccess, className }: PatientFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const rawGender = defaultValues?.gender;
  const initialGender = rawGender
    ? ((rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase()) as "Male" | "Female" | "Other")
    : "Male";
  const validGender = ["Male", "Female", "Other"].includes(initialGender) ? initialGender : "Male";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      age: defaultValues?.age || undefined,
      gender: validGender,
      phone: defaultValues?.phone || "",
    },
  });

  const onSubmit = async (data: PatientFormValues) => {
    setIsPending(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("age", data.age.toString());
      formData.append("gender", data.gender);
      if (data.phone) formData.append("phone", data.phone);

      if (mode === "create") {
        await createPatient(formData);
        toast.success("Patient added successfully");
      } else {
        if (!defaultValues?.id) throw new Error("Missing patient ID");
        formData.append("id", defaultValues.id);
        await updatePatient(formData);
        toast.success("Patient updated successfully");
      }
      
      onSuccess?.();
      router.refresh();
    } catch (error) {
      toast.error(mode === "create" ? "Failed to create patient" : "Failed to update patient");
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" placeholder="John Doe" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name?.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input id="age" type="number" placeholder="30" {...register("age")} />
          {errors.age && <p className="text-sm text-destructive">{errors.age?.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={watch("gender")}
            onValueChange={(value) => setValue("gender", value as any)}
          >
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && <p className="text-sm text-destructive">{errors.gender?.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number (Optional)</Label>
        <Input id="phone" placeholder="+1 234 567 8900" {...register("phone")} />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone?.message}</p>}
      </div>

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {mode === "create" ? "Add Patient" : "Save Changes"}
      </Button>
    </form>
  );
}
