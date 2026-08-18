import { db } from '@/db';
import { otpCodes } from '@/db/schema';
import { and, eq, gt, desc } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// ─── OTP Generation ─────────────────────────────────────────────────────────

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Email Sender (Gmail SMTP with Resend Fallback) ──────────────────────────

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  const smtpUser = process.env.SMTP_USER || 'omjeesingh882@gmail.com';
  const smtpPass = process.env.SMTP_PASS;

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass.replace(/\s+/g, ''),
        },
      });

      await transporter.sendMail({
        from: `"ClinicOCR" <${smtpUser}>`,
        to,
        subject,
        html,
      });

      return { success: true };
    } catch (err: any) {
      console.error('SMTP sendMail error:', err);
      return { success: false, error: err?.message || 'Failed to send verification email.' };
    }
  }

  // Fallback to Resend API if SMTP not configured
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: 'ClinicOCR <onboarding@resend.dev>',
        to,
        subject,
        html,
      });

      if (error) {
        console.error('Resend error:', error);
        return { success: false, error: error.message || 'Failed to send email via Resend.' };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Resend fallback error:', err);
      return { success: false, error: err?.message || 'Failed to send email.' };
    }
  }

  return { success: false, error: 'Email service is not configured.' };
}

// ─── Create & Send OTP ──────────────────────────────────────────────────────

export async function createAndSendOTP(
  email: string,
  type: 'signup' | 'forgot_password'
): Promise<{ success: boolean; error?: string }> {
  try {
    const code = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minute expiry

    // Store OTP in database
    await db.insert(otpCodes).values({
      email: email.toLowerCase().trim(),
      code,
      type,
      expiresAt,
    });

    // Send OTP via email
    const subject = type === 'signup'
      ? 'ClinicOCR - Verify Your Email'
      : 'ClinicOCR - Password Reset Code';

    const body = type === 'signup'
      ? `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
           <h2 style="color: #0f172a; margin-bottom: 8px;">Welcome to ClinicOCR</h2>
           <p style="color: #64748b; margin-bottom: 24px;">Use the verification code below to complete your account setup:</p>
           <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
             <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a;">${code}</span>
           </div>
           <p style="color: #94a3b8; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
         </div>`
      : `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
           <h2 style="color: #0f172a; margin-bottom: 8px;">Password Reset</h2>
           <p style="color: #64748b; margin-bottom: 24px;">Use the code below to reset your ClinicOCR password:</p>
           <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
             <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a;">${code}</span>
           </div>
           <p style="color: #94a3b8; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
         </div>`;

    const result = await sendEmail({
      to: email.toLowerCase().trim(),
      subject,
      html: body,
    });

    return result;
  } catch (error: any) {
    console.error('Error creating OTP:', error);
    return { success: false, error: error?.message || 'Failed to send verification code. Please try again.' };
  }
}

// ─── Verify OTP ─────────────────────────────────────────────────────────────

export async function verifyOTP(
  email: string,
  code: string,
  type: 'signup' | 'forgot_password'
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Find the most recent matching, unexpired, unverified OTP
    const result = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, normalizedEmail),
          eq(otpCodes.code, code),
          eq(otpCodes.type, type),
          eq(otpCodes.verified, false),
          gt(otpCodes.expiresAt, new Date())
        )
      )
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (result.length === 0) {
      return { success: false, error: 'Invalid or expired OTP code. Please try again.' };
    }

    // Mark OTP as verified
    await db
      .update(otpCodes)
      .set({ verified: true })
      .where(eq(otpCodes.id, result[0].id));

    return { success: true };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, error: 'Verification failed. Please try again.' };
  }
}
