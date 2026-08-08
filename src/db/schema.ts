import { pgTable, uuid, text, integer, timestamp, jsonb, boolean, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  age: integer('age').notNull(),
  gender: text('gender').notNull(), // male/female/other
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const patientsRelations = relations(patients, ({ many }) => ({
  prescriptions: many(prescriptions),
}));

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
