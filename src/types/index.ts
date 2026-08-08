import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { patients, prescriptions } from '../db/schema';

export type Patient = InferSelectModel<typeof patients>;
export type NewPatient = InferInsertModel<typeof patients>;

export type Prescription = InferSelectModel<typeof prescriptions>;
export type NewPrescription = InferInsertModel<typeof prescriptions>;

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
}

export interface AIResult {
  correctedText: string;
  summary: string;
  medicines: Medicine[];
  importantFindings: string[];
  tags: string[];
}

export interface QualityCheckResult {
  score: number;
  warnings: string[];
  isAcceptable: boolean;
}

export interface DashboardStats {
  totalPatients: number;
  totalPrescriptions: number;
  recentPrescriptions: (Prescription & { patientName: string })[];
}

export type ProcessingStatus = 'idle' | 'preprocessing' | 'ocr' | 'ai' | 'complete' | 'error';
