'use server';

import { db } from '@/db';
import { patients, prescriptions } from '@/db/schema';
import { eq, desc, ilike, or, count } from 'drizzle-orm';
import { patientSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

export async function getPatients(search?: string) {
  try {
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
      .groupBy(patients.id)
      .orderBy(desc(patients.createdAt));

    if (search && search.trim()) {
      const searchTerm = search.trim();
      query = query.where(
        or(
          ilike(patients.name, `%${searchTerm}%`),
          ilike(patients.phone, `%${searchTerm}%`)
        )
      ) as any;
    }

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
  try {
    const result = await db
      .select()
      .from(patients)
      .where(eq(patients.id, id))
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
  try {
    const id = typeof idOrFormData === 'string' ? idOrFormData : (idOrFormData.get('id') as string);
    if (!id) throw new Error('Patient ID is required');

    await db.delete(patients).where(eq(patients.id, id));

    revalidatePath('/patients');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error(`Error deleting patient:`, error);
    throw new Error('Failed to delete patient');
  }
}

