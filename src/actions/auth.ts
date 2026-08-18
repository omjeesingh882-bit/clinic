'use server';

import { db } from '@/db';
import { doctors } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { hashPassword, verifyPassword, createSession, deleteSession } from '@/lib/auth';
import { createAndSendOTP, verifyOTP } from '@/lib/otp';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// ─── Validation Schemas ─────────────────────────────────────────────────────

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const usernameSchema = z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be at most 30 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

// ─── Signup Step 1: Send OTP ────────────────────────────────────────────────

export async function sendSignupOTP(email: string) {
  try {
    const validatedEmail = emailSchema.parse(email);
    const normalizedEmail = validatedEmail.toLowerCase().trim();

    // Check if email already registered
    const existing = await db
      .select({ id: doctors.id })
      .from(doctors)
      .where(eq(doctors.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: 'An account with this email already exists. Please login instead.' };
    }

    // Send OTP
    const result = await createAndSendOTP(normalizedEmail, 'signup');
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error('Error in sendSignupOTP:', error);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}

// ─── Signup Step 2: Verify OTP ──────────────────────────────────────────────

export async function verifySignupOTP(email: string, code: string) {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const result = await verifyOTP(normalizedEmail, code, 'signup');
    return result;
  } catch (error) {
    console.error('Error in verifySignupOTP:', error);
    return { success: false, error: 'Verification failed. Please try again.' };
  }
}

// ─── Signup Step 3: Create Account ──────────────────────────────────────────

export async function completeSignup(data: {
  email: string;
  name: string;
  username: string;
  password: string;
}) {
  try {
    const validatedName = z.string().min(2, 'Name must be at least 2 characters').parse(data.name);
    const validatedUsername = usernameSchema.parse(data.username);
    const validatedPassword = passwordSchema.parse(data.password);
    const normalizedEmail = data.email.toLowerCase().trim();

    // Check username availability
    const existingUsername = await db
      .select({ id: doctors.id })
      .from(doctors)
      .where(eq(doctors.username, validatedUsername.toLowerCase()))
      .limit(1);

    if (existingUsername.length > 0) {
      return { success: false, error: 'This username is already taken. Please choose another.' };
    }

    // Check email not already registered (double-check)
    const existingEmail = await db
      .select({ id: doctors.id })
      .from(doctors)
      .where(eq(doctors.email, normalizedEmail))
      .limit(1);

    if (existingEmail.length > 0) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    // Hash password and create doctor
    const passwordHash = await hashPassword(validatedPassword);

    const [doctor] = await db
      .insert(doctors)
      .values({
        username: validatedUsername.toLowerCase(),
        email: normalizedEmail,
        passwordHash,
        name: validatedName,
      })
      .returning();

    // Create session and login
    await createSession(doctor.id);

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error('Error in completeSignup:', error);
    return { success: false, error: 'Failed to create account. Please try again.' };
  }
}

// ─── Login ──────────────────────────────────────────────────────────────────

export async function loginAction(identifier: string, password: string) {
  try {
    if (!identifier || !password) {
      return { success: false, error: 'Please enter your username/email and password.' };
    }

    const normalizedIdentifier = identifier.toLowerCase().trim();

    // Find doctor by username or email
    const result = await db
      .select()
      .from(doctors)
      .where(
        or(
          eq(doctors.username, normalizedIdentifier),
          eq(doctors.email, normalizedIdentifier)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return { success: false, error: 'Invalid username/email or password.' };
    }

    const doctor = result[0];

    // Verify password
    const isValid = await verifyPassword(password, doctor.passwordHash);
    if (!isValid) {
      return { success: false, error: 'Invalid username/email or password.' };
    }

    // Create session
    await createSession(doctor.id);

    return { success: true };
  } catch (error) {
    console.error('Error in loginAction:', error);
    return { success: false, error: 'Login failed. Please try again.' };
  }
}

// ─── Forgot Password Step 1: Send OTP ──────────────────────────────────────

export async function sendForgotPasswordOTP(email: string) {
  try {
    const validatedEmail = emailSchema.parse(email);
    const normalizedEmail = validatedEmail.toLowerCase().trim();

    // Check if email exists
    const existing = await db
      .select({ id: doctors.id })
      .from(doctors)
      .where(eq(doctors.email, normalizedEmail))
      .limit(1);

    if (existing.length === 0) {
      // Don't reveal if email exists or not for security
      return { success: true };
    }

    // Send OTP
    const result = await createAndSendOTP(normalizedEmail, 'forgot_password');
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error('Error in sendForgotPasswordOTP:', error);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}

// ─── Forgot Password Step 2: Verify OTP ────────────────────────────────────

export async function verifyForgotPasswordOTP(email: string, code: string) {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const result = await verifyOTP(normalizedEmail, code, 'forgot_password');
    return result;
  } catch (error) {
    console.error('Error in verifyForgotPasswordOTP:', error);
    return { success: false, error: 'Verification failed. Please try again.' };
  }
}

// ─── Forgot Password Step 3: Reset Password ────────────────────────────────

export async function resetPassword(email: string, newPassword: string) {
  try {
    const validatedPassword = passwordSchema.parse(newPassword);
    const normalizedEmail = email.toLowerCase().trim();

    const passwordHash = await hashPassword(validatedPassword);

    const result = await db
      .update(doctors)
      .set({ passwordHash })
      .where(eq(doctors.email, normalizedEmail))
      .returning();

    if (result.length === 0) {
      return { success: false, error: 'Account not found.' };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error('Error in resetPassword:', error);
    return { success: false, error: 'Failed to reset password. Please try again.' };
  }
}

// ─── Logout ─────────────────────────────────────────────────────────────────

export async function logoutAction() {
  await deleteSession();
  redirect('/login');
}
