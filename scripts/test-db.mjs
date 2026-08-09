import { db } from '../src/db/index.js';
import { patients, prescriptions } from '../src/db/schema.js';

async function testDB() {
  try {
    const p = await db.select().from(patients).limit(5);
    console.log('DB Patients count:', p.length);
    const pr = await db.select().from(prescriptions).limit(5);
    console.log('DB Prescriptions count:', pr.length);
  } catch (e) {
    console.error('DB Error:', e);
  }
}

testDB();
