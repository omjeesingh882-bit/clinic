import { db } from '@/db';
import { doctors, sessions } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const SESSION_DURATION_DAYS = 7;
const SESSION_COOKIE_NAME = 'clinic_session';

// ─── Password Utilities ─────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Session Management ─────────────────────────────────────────────────────

export async function createSession(doctorId: string): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  const [session] = await db
    .insert(sessions)
    .values({ doctorId, expiresAt })
    .returning();

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return session.id;
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) return null;

  try {
    const result = await db
      .select({
        sessionId: sessions.id,
        doctorId: doctors.id,
        doctorName: doctors.name,
        doctorEmail: doctors.email,
        doctorUsername: doctors.username,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .innerJoin(doctors, eq(sessions.doctorId, doctors.id))
      .where(
        and(
          eq(sessions.id, sessionId),
          gt(sessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (result.length === 0) {
      // Session expired or invalid — clear cookie
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    try {
      await db.delete(sessions).where(eq(sessions.id, sessionId));
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return session!;
}
