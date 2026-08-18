'use server';

import { db } from '@/db';
import { patients, prescriptions, doctors } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export interface ParentPatientRecord {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string | null;
  createdAt: Date | null;
  doctorName?: string;
  prescriptions: ParentPrescriptionRecord[];
  allMedicines: AggregatedMedicine[];
}

export interface ParentPrescriptionRecord {
  id: string;
  patientId: string;
  imageUrl: string;
  aiSummary: string | null;
  correctedText: string | null;
  doctorNotes: string | null;
  importantFindings: string[];
  tags: string[];
  important: boolean;
  medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  createdAt: Date | null;
  dateString: string;
}

export interface AggregatedMedicine {
  name: string;
  dosage: string;
  frequency: string;
  prescriptionId: string;
  prescribedDate: string;
}

/**
 * Normalizes phone numbers by stripping non-digit characters for robust matching.
 */
function normalizePhone(rawPhone?: string | null): string {
  if (!rawPhone) return '';
  return rawPhone.replace(/\D/g, '');
}

/**
 * Searches patient records for the Parent Portal using exact name (case-insensitive)
 * and phone number (case-insensitive, format-tolerant).
 */
export async function searchParentPatient(rawName: string, rawPhone: string) {
  try {
    const trimmedName = (rawName || '').trim();
    const trimmedPhone = (rawPhone || '').trim();

    if (!trimmedName || !trimmedPhone) {
      return {
        success: false,
        error: 'Please enter both the patient name and phone number.',
        patients: [] as ParentPatientRecord[],
      };
    }

    const cleanInputPhoneDigits = normalizePhone(trimmedPhone);

    // Query patients with case-insensitive name match
    const matchingPatients = await db
      .select({
        patient: patients,
        doctor: {
          name: doctors.name,
        },
      })
      .from(patients)
      .leftJoin(doctors, eq(patients.doctorId, doctors.id))
      .where(sql`LOWER(TRIM(${patients.name})) = LOWER(TRIM(${trimmedName}))`);

    if (matchingPatients.length === 0) {
      return {
        success: false,
        error: 'No patient record found matching the name and phone number provided.',
        patients: [] as ParentPatientRecord[],
      };
    }

    // Filter by phone number (tolerant of dashes, spaces, brackets, or exact match)
    const filtered = matchingPatients.filter(({ patient }) => {
      if (!patient.phone) return false;
      const patientPhoneTrimmed = patient.phone.trim().toLowerCase();
      const inputPhoneTrimmed = trimmedPhone.toLowerCase();

      if (patientPhoneTrimmed === inputPhoneTrimmed) return true;

      const patientDigits = normalizePhone(patient.phone);
      if (cleanInputPhoneDigits && patientDigits) {
        if (patientDigits === cleanInputPhoneDigits) return true;
        // Handle numbers with country codes (e.g. 919876543210 vs 9876543210)
        if (
          patientDigits.endsWith(cleanInputPhoneDigits) ||
          cleanInputPhoneDigits.endsWith(patientDigits)
        ) {
          return true;
        }
      }

      return false;
    });

    if (filtered.length === 0) {
      return {
        success: false,
        error: 'Patient name was found, but the phone number did not match our records. Please verify the phone number.',
        patients: [] as ParentPatientRecord[],
      };
    }

    // For each matching patient, fetch their prescriptions in read-only format
    const results: ParentPatientRecord[] = [];

    for (const item of filtered) {
      const p = item.patient;
      const doc = item.doctor;

      const rxRows = await db
        .select()
        .from(prescriptions)
        .where(eq(prescriptions.patientId, p.id))
        .orderBy(desc(prescriptions.createdAt));

      const allMedicines: AggregatedMedicine[] = [];

      const formattedRx: ParentPrescriptionRecord[] = rxRows.map((rx) => {
        const meds = (rx.medicinesJson as any[]) || [];
        const dateFormatted = rx.createdAt
          ? new Date(rx.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : 'Unknown date';

        meds.forEach((m) => {
          if (m && m.name) {
            allMedicines.push({
              name: m.name,
              dosage: m.dosage || 'As advised',
              frequency: m.frequency || 'As directed',
              prescriptionId: rx.id,
              prescribedDate: dateFormatted,
            });
          }
        });

        return {
          id: rx.id,
          patientId: rx.patientId,
          imageUrl: rx.imageUrl,
          aiSummary: rx.aiSummary,
          correctedText: rx.correctedText,
          doctorNotes: rx.doctorNotes,
          importantFindings: (rx.importantFindings as string[]) || [],
          tags: (rx.tags as string[]) || [],
          important: Boolean(rx.important),
          medicines: meds.map((m) => ({
            name: m.name || '',
            dosage: m.dosage || 'As directed',
            frequency: m.frequency || 'Daily',
          })),
          createdAt: rx.createdAt,
          dateString: dateFormatted,
        };
      });

      results.push({
        id: p.id,
        name: p.name,
        age: p.age,
        gender: p.gender,
        phone: p.phone,
        createdAt: p.createdAt,
        doctorName: doc?.name || 'Clinic Doctor',
        prescriptions: formattedRx,
        allMedicines,
      });
    }

    return {
      success: true,
      patients: results,
    };
  } catch (error) {
    console.error('Error in searchParentPatient:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while searching. Please try again.',
      patients: [] as ParentPatientRecord[],
    };
  }
}

/**
 * Fetch a single prescription for a parent with patient ID verification (read-only)
 */
export async function getPublicPrescriptionForParent(prescriptionId: string, patientId: string) {
  try {
    const result = await db
      .select({
        prescription: prescriptions,
        patient: patients,
        doctor: {
          name: doctors.name,
        },
      })
      .from(prescriptions)
      .innerJoin(patients, eq(prescriptions.patientId, patients.id))
      .leftJoin(doctors, eq(patients.doctorId, doctors.id))
      .where(sql`${prescriptions.id} = ${prescriptionId} AND ${patients.id} = ${patientId}`)
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const { prescription: p, patient, doctor } = result[0];
    const medicines = (p.medicinesJson as any[]) || [];

    return {
      id: p.id,
      patientId: p.patientId,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      patientPhone: patient.phone,
      doctorName: doctor?.name || 'Clinic Doctor',
      imageUrl: p.imageUrl,
      rawText: p.rawOcr,
      correctedText: p.correctedText,
      summary: p.aiSummary,
      medicines,
      tags: (p.tags as string[]) || [],
      findings: (p.importantFindings as string[]) || [],
      notes: p.doctorNotes,
      createdAt: p.createdAt,
      dateString: p.createdAt
        ? new Date(p.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'Unknown',
    };
  } catch (error) {
    console.error('Error fetching parent prescription:', error);
    return null;
  }
}
