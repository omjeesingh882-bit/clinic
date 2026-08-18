'use server';

import { db } from '@/db';
import { patients, prescriptions } from '@/db/schema';
import { eq, desc, ilike, or, count, and } from 'drizzle-orm';
import { patientSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';

export async function getPatients(search?: string) {
  const session = await requireAuth();

  try {
    let baseWhere = eq(patients.doctorId, session.doctorId);

    let query = db
      .select({
        id: patients.id,
        name: patients.name,
        phone: patients.phone,
        age: patients.age,
        gender: patients.gender,
        createdAt: patients.createdAt,
        prescriptionCount: count(prescriptions.id),
      })
      .from(patients)
      .leftJoin(prescriptions, eq(patients.id, prescriptions.patientId))
      .where(
        search && search.trim()
          ? and(
              baseWhere,
              or(
                ilike(patients.name, `%${search.trim()}%`),
                ilike(patients.phone, `%${search.trim()}%`)
              )
            )
          : baseWhere
      )
      .groupBy(patients.id)
      .orderBy(desc(patients.createdAt));

    const results = await query;
    return results.map((p) => ({
      ...p,
      prescriptionCount: Number(p.prescriptionCount || 0),
    }));
  } catch (error) {
    console.error('Error fetching patients:', error);
    return [];
  }
}

export async function getPatientById(id: string) {
  const session = await requireAuth();

  try {
    const result = await db
      .select()
      .from(patients)
      .where(and(eq(patients.id, id), eq(patients.doctorId, session.doctorId)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error(`Error fetching patient ${id}:`, error);
    return null;
  }
}

export async function createPatient(formData: FormData) {
  const session = await requireAuth();

  try {
    const rawAge = formData.get('age');
    const data = {
      name: (formData.get('name') as string) || '',
      age: rawAge ? Number(rawAge) : 0,
      gender: (formData.get('gender') as string) || 'Male',
      phone: (formData.get('phone') as string) || '',
    };

    const validatedData = patientSchema.parse(data);

    const result = await db
      .insert(patients)
      .values({
        doctorId: session.doctorId,
        name: validatedData.name,
        age: validatedData.age,
        gender: validatedData.gender,
        phone: validatedData.phone || null,
      })
      .returning();

    revalidatePath('/patients');
    revalidatePath('/dashboard');
    revalidatePath('/upload');

    return result[0];
  } catch (error) {
    console.error('Error creating patient:', error);
    throw new Error('Failed to create patient');
  }
}

export async function updatePatient(
  idOrFormData: string | FormData,
  maybeFormData?: FormData
) {
  const session = await requireAuth();

  try {
    let id: string;
    let formData: FormData;

    if (typeof idOrFormData === 'string') {
      id = idOrFormData;
      formData = maybeFormData!;
    } else {
      formData = idOrFormData;
      id = formData.get('id') as string;
    }

    if (!id) {
      throw new Error('Patient ID is required for update');
    }

    // Verify patient belongs to this doctor
    const existing = await db
      .select({ id: patients.id })
      .from(patients)
      .where(and(eq(patients.id, id), eq(patients.doctorId, session.doctorId)))
      .limit(1);

    if (existing.length === 0) {
      throw new Error('Patient not found');
    }

    const rawAge = formData.get('age');
    const data = {
      name: (formData.get('name') as string) || '',
      age: rawAge ? Number(rawAge) : 0,
      gender: (formData.get('gender') as string) || 'Male',
      phone: (formData.get('phone') as string) || '',
    };

    const validatedData = patientSchema.parse(data);

    const result = await db
      .update(patients)
      .set({
        name: validatedData.name,
        age: validatedData.age,
        gender: validatedData.gender,
        phone: validatedData.phone || null,
      })
      .where(eq(patients.id, id))
      .returning();

    revalidatePath('/patients');
    revalidatePath(`/patients/${id}`);
    revalidatePath('/dashboard');

    return result[0];
  } catch (error) {
    console.error(`Error updating patient:`, error);
    throw new Error('Failed to update patient');
  }
}

export async function deletePatient(idOrFormData: string | FormData) {
  const session = await requireAuth();

  try {
    const id = typeof idOrFormData === 'string' ? idOrFormData : (idOrFormData.get('id') as string);
    if (!id) throw new Error('Patient ID is required');

    // Verify patient belongs to this doctor
    const existing = await db
      .select({ id: patients.id })
      .from(patients)
      .where(and(eq(patients.id, id), eq(patients.doctorId, session.doctorId)))
      .limit(1);

    if (existing.length === 0) {
      throw new Error('Patient not found');
    }

    await db.delete(patients).where(eq(patients.id, id));

    revalidatePath('/patients');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error(`Error deleting patient:`, error);
    throw new Error('Failed to delete patient');
  }
}
