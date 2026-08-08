CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"age" integer NOT NULL,
	"gender" text NOT NULL,
	"phone" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"raw_ocr" text,
	"corrected_text" text,
	"ai_summary" text,
	"medicines_json" jsonb,
	"tags" jsonb,
	"important_findings" jsonb,
	"doctor_notes" text,
	"important" boolean DEFAULT false,
	"ocr_confidence" real,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;