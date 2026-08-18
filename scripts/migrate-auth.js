const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  try {
    console.log('Creating doctors table...');
    await sql`CREATE TABLE IF NOT EXISTS "doctors" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "username" text NOT NULL,
      "email" text NOT NULL,
      "password_hash" text NOT NULL,
      "name" text NOT NULL,
      "created_at" timestamp DEFAULT now(),
      CONSTRAINT "doctors_username_unique" UNIQUE("username"),
      CONSTRAINT "doctors_email_unique" UNIQUE("email")
    )`;
    
    console.log('Creating otp_codes table...');
    await sql`CREATE TABLE IF NOT EXISTS "otp_codes" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "email" text NOT NULL,
      "code" text NOT NULL,
      "type" text NOT NULL,
      "expires_at" timestamp NOT NULL,
      "verified" boolean DEFAULT false,
      "created_at" timestamp DEFAULT now()
    )`;
    
    console.log('Creating sessions table...');
    await sql`CREATE TABLE IF NOT EXISTS "sessions" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "doctor_id" uuid NOT NULL,
      "expires_at" timestamp NOT NULL,
      "created_at" timestamp DEFAULT now()
    )`;
    
    console.log('Adding doctor_id to patients...');
    try {
      await sql`ALTER TABLE "patients" ADD COLUMN "doctor_id" uuid`;
    } catch (e) {
      if (e.code === '42701') {
        console.log('  doctor_id column already exists, skipping.');
      } else {
        throw e;
      }
    }
    
    console.log('Adding sessions foreign key...');
    try {
      await sql`ALTER TABLE "sessions" ADD CONSTRAINT "sessions_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action`;
    } catch (e) {
      if (e.code === '42710') {
        console.log('  Constraint already exists, skipping.');
      } else {
        throw e;
      }
    }
    
    console.log('Adding patients foreign key...');
    try {
      await sql`ALTER TABLE "patients" ADD CONSTRAINT "patients_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action`;
    } catch (e) {
      if (e.code === '42710') {
        console.log('  Constraint already exists, skipping.');
      } else {
        throw e;
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
