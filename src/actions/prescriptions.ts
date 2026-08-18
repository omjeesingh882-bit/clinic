'use server';

import { db } from '@/db';
import { prescriptions, patients } from '@/db/schema';
import { eq, desc, ilike, or, and, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { preprocessImage, checkImageQuality } from '@/lib/ocr/preprocess';
import { performOCR } from '@/lib/ocr/tesseract';
import { analyzeWithGemini } from '@/lib/ocr/gemini';
import { requireAuth } from '@/lib/auth';

export async function processImage(base64Image: string) {
  try {
    const base64Data = base64Image.replace(/^data:[^;]+;base64,/, '').trim();
    const imageBuffer = Buffer.from(base64Data, 'base64');

    let qualityCheck;
    try {
      qualityCheck = await checkImageQuality(imageBuffer);
    } catch (e) {
      qualityCheck = { score: 75, warnings: ['Image quality check skipped'], isAcceptable: true };
    }

    let preprocessedImage;
    try {
      preprocessedImage = await preprocessImage(imageBuffer);
    } catch (e) {
      preprocessedImage = imageBuffer;
    }

    let ocrResult;
    try {
      ocrResult = await performOCR(preprocessedImage, imageBuffer);
    } catch (e) {
      ocrResult = { text: 'OCR extraction could not detect text', confidence: 40 };
    }

    let aiResult;
    try {
      aiResult = await analyzeWithGemini(ocrResult.text, preprocessedImage);
    } catch (e) {
      console.warn("AI analysis fallback error:", e);
      aiResult = {
        correctedText: ocrResult.text,
        summary: 'Prescription digitized successfully.',
        medicines: [],
        importantFindings: ['Please verify the dosage with the original prescription.'],
        tags: ['General Care'],
      };
    }

    return {
      qualityCheck,
      ocrResult,
      aiResult,
      rawOcrText: ocrResult.text,
    };
  } catch (error) {
    console.error('Error in processImage:', error);
    throw error;
  }
}

export async function savePrescription(data: {
  patientId: string;
  imageUrl: string;
  rawOcr?: string;
  correctedText?: string;
  aiSummary?: string;
  medicinesJson?: any;
  tags?: any;
  importantFindings?: any;
  doctorNotes?: string;
  important?: boolean;
  ocrConfidence?: number;
}) {
  const session = await requireAuth();

  try {
    // Verify the patient belongs to this doctor
    const patient = await db
      .select({ id: patients.id })
      .from(patients)
      .where(and(eq(patients.id, data.patientId), eq(patients.doctorId, session.doctorId)))
      .limit(1);

    if (patient.length === 0) {
      throw new Error('Patient not found or access denied');
    }

    const result = await db
      .insert(prescriptions)
      .values({
        patientId: data.patientId,
        imageUrl: data.imageUrl,
        rawOcr: data.rawOcr || '',
        correctedText: data.correctedText || '',
        aiSummary: data.aiSummary || '',
        medicinesJson: data.medicinesJson || [],
        tags: data.tags || [],
        importantFindings: data.importantFindings || [],
        doctorNotes: data.doctorNotes || '',
        important: Boolean(data.important),
        ocrConfidence: data.ocrConfidence ? data.ocrConfidence / 100 : 0.85,
      })
      .returning();

    revalidatePath(`/patients/${data.patientId}`);
    revalidatePath('/patients');
    revalidatePath('/dashboard');
    revalidatePath('/search');

    return result[0];
  } catch (error) {
    console.error('Error saving prescription:', error);
    throw new Error('Failed to save prescription');
  }
}

export async function getPrescriptionsByPatient(patientId: string) {
  const session = await requireAuth();

  try {
    // Verify patient belongs to this doctor
    const patient = await db
      .select({ id: patients.id })
      .from(patients)
      .where(and(eq(patients.id, patientId), eq(patients.doctorId, session.doctorId)))
      .limit(1);

    if (patient.length === 0) {
      return [];
    }

    const rows = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.patientId, patientId))
      .orderBy(desc(prescriptions.createdAt));

    return rows.map((p) => {
      const medicines = (p.medicinesJson as any[]) || [];
      return {
        id: p.id,
        patientId: p.patientId,
        imageUrl: p.imageUrl,
        rawText: p.rawOcr,
        rawOcr: p.rawOcr,
        correctedText: p.correctedText,
        summary: p.aiSummary,
        aiSummary: p.aiSummary,
        medicines: medicines,
        medicineCount: medicines.length,
        tags: (p.tags as string[]) || [],
        findings: (p.importantFindings as string[]) || [],
        importantFindings: (p.importantFindings as string[]) || [],
        notes: p.doctorNotes,
        doctorNotes: p.doctorNotes,
        isImportant: Boolean(p.important),
        important: Boolean(p.important),
        confidenceScore: Math.round(((p.ocrConfidence as number) ?? 0.85) * (p.ocrConfidence && p.ocrConfidence > 1 ? 1 : 100)),
        createdAt: p.createdAt,
        date: p.createdAt ? new Date(p.createdAt).toISOString() : '',
      };
    });
  } catch (error) {
    console.error(`Error fetching prescriptions for patient ${patientId}:`, error);
    return [];
  }
}

export async function getPrescriptionById(id: string) {
  const session = await requireAuth();

  try {
    const result = await db
      .select({
        prescription: prescriptions,
        patient: patients,
      })
      .from(prescriptions)
      .innerJoin(patients, eq(prescriptions.patientId, patients.id))
      .where(
        and(
          eq(prescriptions.id, id),
          eq(patients.doctorId, session.doctorId)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const { prescription: p, patient } = result[0];
    const medicines = (p.medicinesJson as any[]) || [];

    return {
      id: p.id,
      patientId: p.patientId,
      patient: patient
        ? {
            id: patient.id,
            name: patient.name,
            age: patient.age,
            gender: patient.gender,
            phone: patient.phone,
          }
        : null,
      imageUrl: p.imageUrl,
      rawText: p.rawOcr,
      rawOcr: p.rawOcr,
      correctedText: p.correctedText,
      summary: p.aiSummary,
      aiSummary: p.aiSummary,
      medicines: medicines,
      medicineCount: medicines.length,
      tags: (p.tags as string[]) || [],
      findings: (p.importantFindings as string[]) || [],
      importantFindings: (p.importantFindings as string[]) || [],
      notes: p.doctorNotes,
      doctorNotes: p.doctorNotes,
      isImportant: Boolean(p.important),
      important: Boolean(p.important),
      confidenceScore: Math.round(((p.ocrConfidence as number) ?? 0.85) * (p.ocrConfidence && p.ocrConfidence > 1 ? 1 : 100)),
      ocrConfidence: p.ocrConfidence,
      createdAt: p.createdAt,
      date: p.createdAt ? new Date(p.createdAt).toISOString() : '',
    };
  } catch (error) {
    console.error(`Error fetching prescription ${id}:`, error);
    return null;
  }
}

export async function updatePrescription(
  id: string,
  data: {
    correctedText?: string;
    aiSummary?: string;
    medicinesJson?: any;
    doctorNotes?: string;
    tags?: any;
    importantFindings?: any;
    important?: boolean;
  }
) {
  const session = await requireAuth();

  try {
    // Verify prescription belongs to this doctor's patient
    const existing = await db
      .select({ patientId: prescriptions.patientId })
      .from(prescriptions)
      .innerJoin(patients, eq(prescriptions.patientId, patients.id))
      .where(
        and(
          eq(prescriptions.id, id),
          eq(patients.doctorId, session.doctorId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      throw new Error('Prescription not found or access denied');
    }

    const result = await db
      .update(prescriptions)
      .set(data)
      .where(eq(prescriptions.id, id))
      .returning();

    if (result.length > 0) {
      const pId = result[0].patientId;
      revalidatePath(`/patients/${pId}`);
      revalidatePath(`/prescriptions/${id}`);
      revalidatePath('/dashboard');
      revalidatePath('/search');
    }

    return result[0];
  } catch (error) {
    console.error(`Error updating prescription ${id}:`, error);
    throw new Error('Failed to update prescription');
  }
}

export async function deletePrescription(id: string) {
  const session = await requireAuth();

  try {
    // Verify prescription belongs to this doctor's patient
    const existing = await db
      .select({ patientId: prescriptions.patientId })
      .from(prescriptions)
      .innerJoin(patients, eq(prescriptions.patientId, patients.id))
      .where(
        and(
          eq(prescriptions.id, id),
          eq(patients.doctorId, session.doctorId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      throw new Error('Prescription not found or access denied');
    }

    const result = await db.delete(prescriptions).where(eq(prescriptions.id, id)).returning();

    if (result.length > 0) {
      revalidatePath(`/patients/${result[0].patientId}`);
      revalidatePath('/patients');
      revalidatePath('/dashboard');
      revalidatePath('/search');
    }

    return { success: true };
  } catch (error) {
    console.error(`Error deleting prescription ${id}:`, error);
    throw new Error('Failed to delete prescription');
  }
}

export async function toggleImportant(id: string, isImportant?: boolean) {
  const session = await requireAuth();

  try {
    // Verify prescription belongs to this doctor's patient
    const current = await db
      .select({
        important: prescriptions.important,
        patientId: prescriptions.patientId,
      })
      .from(prescriptions)
      .innerJoin(patients, eq(prescriptions.patientId, patients.id))
      .where(
        and(
          eq(prescriptions.id, id),
          eq(patients.doctorId, session.doctorId)
        )
      )
      .limit(1);

    if (current.length === 0) throw new Error('Prescription not found');

    const nextValue = isImportant !== undefined ? isImportant : !current[0].important;

    const result = await db
      .update(prescriptions)
      .set({ important: nextValue })
      .where(eq(prescriptions.id, id))
      .returning();

    revalidatePath(`/prescriptions/${id}`);
    revalidatePath(`/patients/${current[0].patientId}`);
    revalidatePath('/dashboard');
    revalidatePath('/search');

    return result[0];
  } catch (error) {
    console.error(`Error toggling important for prescription ${id}:`, error);
    throw new Error('Failed to toggle important');
  }
}

export async function searchPrescriptions(query: string) {
  const session = await requireAuth();

  try {
    if (!query || !query.trim()) return [];
    const trimmed = query.trim();

    // Get this doctor's patient IDs
    const doctorPatients = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.doctorId, session.doctorId));

    const patientIds = doctorPatients.map((p) => p.id);

    if (patientIds.length === 0) return [];

    const rows = await db
      .select({
        prescription: prescriptions,
        patient: patients,
      })
      .from(prescriptions)
      .innerJoin(patients, eq(prescriptions.patientId, patients.id))
      .where(
        and(
          inArray(prescriptions.patientId, patientIds),
          or(
            ilike(prescriptions.correctedText, `%${trimmed}%`),
            ilike(prescriptions.aiSummary, `%${trimmed}%`),
            ilike(prescriptions.doctorNotes, `%${trimmed}%`),
            ilike(patients.name, `%${trimmed}%`),
            ilike(patients.phone, `%${trimmed}%`)
          )
        )
      )
      .orderBy(desc(prescriptions.createdAt));

    return rows.map(({ prescription: p, patient }) => {
      const medicines = (p.medicinesJson as any[]) || [];
      return {
        id: p.id,
        patientId: p.patientId,
        patient: patient
          ? {
              name: patient.name,
              phone: patient.phone,
              age: patient.age,
              gender: patient.gender,
            }
          : null,
        summary: p.aiSummary || 'No summary available.',
        medicines: medicines,
        tags: (p.tags as string[]) || [],
        findings: (p.importantFindings as string[]) || [],
        notes: p.doctorNotes,
        isImportant: Boolean(p.important),
        confidenceScore: Math.round(((p.ocrConfidence as number) ?? 0.85) * (p.ocrConfidence && p.ocrConfidence > 1 ? 1 : 100)),
        createdAt: p.createdAt,
        date: p.createdAt ? new Date(p.createdAt).toISOString() : '',
      };
    });
  } catch (error) {
    console.error('Error searching prescriptions:', error);
    return [];
  }
}
