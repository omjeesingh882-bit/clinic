import { z } from 'zod';

export const patientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be at most 100 characters"),
  age: z.coerce.number().int().min(0, "Age must be a positive number").max(150, "Age must be at most 150"),
  gender: z.enum(["Male", "Female", "Other", "male", "female", "other"]),
  phone: z.string().optional().or(z.literal('')),
});

export const prescriptionSearchSchema = z.object({
  query: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

