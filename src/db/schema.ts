import { pgTable, uuid, text, integer, timestamp, jsonb, boolean, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Doctors (authentication) ────────────────────────────────────────────────

export const doctors = pgTable('doctors', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const doctorsRelations = relations(doctors, ({ many }) => ({
  patients: many(patients),
  sessions: many(sessions),
}));

// ─── Sessions (cookie-based auth) ───────────────────────────────────────────

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  doctorId: uuid('doctor_id').references(() => doctors.id, { onDelete: 'cascade' }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  doctor: one(doctors, {
    fields: [sessions.doctorId],
    references: [doctors.id],
  }),
}));

// ─── OTP Codes (email verification) ─────────────────────────────────────────

export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  code: text('code').notNull(),
  type: text('type').notNull(), // 'signup' | 'forgot_password'
  expiresAt: timestamp('expires_at').notNull(),
  verified: boolean('verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Patients ───────────────────────────────────────────────────────────────

export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  doctorId: uuid('doctor_id').references(() => doctors.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  age: integer('age').notNull(),
  gender: text('gender').notNull(),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const patientsRelations = relations(patients, ({ one, many }) => ({
  doctor: one(doctors, {
    fields: [patients.doctorId],
    references: [doctors.id],
  }),
  prescriptions: many(prescriptions),
}));

// ─── Prescriptions ──────────────────────────────────────────────────────────

export const prescriptions = pgTable('prescriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }).notNull(),
  imageUrl: text('image_url').notNull(),
  rawOcr: text('raw_ocr'),
  correctedText: text('corrected_text'),
  aiSummary: text('ai_summary'),
  medicinesJson: jsonb('medicines_json'),
  tags: jsonb('tags'),
  importantFindings: jsonb('important_findings'),
  doctorNotes: text('doctor_notes'),
  important: boolean('important').default(false),
  ocrConfidence: real('ocr_confidence'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  patient: one(patients, {
    fields: [prescriptions.patientId],
    references: [patients.id],
  }),
}));
