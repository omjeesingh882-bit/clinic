'use server';

import { db } from '@/db';
import { patients, prescriptions } from '@/db/schema';
import { desc, count, sql, eq, and, inArray } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export async function getDashboardStats() {
  const session = await requireAuth();

  try {
    // Get this doctor's patient IDs
    const doctorPatients = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.doctorId, session.doctorId));

    const patientIds = doctorPatients.map((p) => p.id);

    const totalPatients = patientIds.length;

    if (totalPatients === 0) {
      return {
        totalPatients: 0,
        totalPrescriptions: 0,
        thisMonth: 0,
        recentPrescriptions: [],
      };
    }

    const [prescriptionCount] = await db
      .select({ count: count() })
      .from(prescriptions)
      .where(inArray(prescriptions.patientId, patientIds));

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [thisMonthResult] = await db
      .select({ count: count() })
      .from(prescriptions)
      .where(
        and(
          inArray(prescriptions.patientId, patientIds),
          sql`${prescriptions.createdAt} >= ${startOfMonth}`
        )
      );

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
      .innerJoin(patients, eq(prescriptions.patientId, patients.id))
      .where(inArray(prescriptions.patientId, patientIds))
      .orderBy(desc(prescriptions.createdAt))
      .limit(5);

    return {
      totalPatients,
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
