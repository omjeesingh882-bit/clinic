'use server';

import { db } from '@/db';
import { patients, prescriptions } from '@/db/schema';
import { desc, count, sql, eq } from 'drizzle-orm';

export async function getDashboardStats() {
  try {
    const [patientCount] = await db
      .select({ count: count() })
      .from(patients);

    const [prescriptionCount] = await db
      .select({ count: count() })
      .from(prescriptions);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [thisMonthResult] = await db
      .select({ count: count() })
      .from(prescriptions)
      .where(sql`${prescriptions.createdAt} >= ${startOfMonth}`);

    const recentPrescriptions = await db
      .select({
        id: prescriptions.id,
        patientName: patients.name,
        patientId: prescriptions.patientId,
        aiSummary: prescriptions.aiSummary,
        createdAt: prescriptions.createdAt,
        important: prescriptions.important,
        tags: prescriptions.tags,
      })
      .from(prescriptions)
      .leftJoin(patients, eq(prescriptions.patientId, patients.id))
      .orderBy(desc(prescriptions.createdAt))
      .limit(5);

    return {
      totalPatients: Number(patientCount?.count || 0),
      totalPrescriptions: Number(prescriptionCount?.count || 0),
      thisMonth: Number(thisMonthResult?.count || 0),
      recentPrescriptions: (recentPrescriptions || []).map((r) => ({
        id: r.id,
        patientName: r.patientName || 'Unknown Patient',
        patientId: r.patientId,
        summary: r.aiSummary || 'No summary available',
        date: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '',
        important: Boolean(r.important),
        tags: (r.tags as string[]) || [],
      })),
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return {
      totalPatients: 0,
      totalPrescriptions: 0,
      thisMonth: 0,
      recentPrescriptions: [],
    };
  }
}

