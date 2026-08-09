import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';

// read .env.local manually if dotenv is not installed
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    value = value.trim().replace(/^['"](.*)['"]$/, '$1');
    envVars[match[1]] = value;
  }
}

console.log('Key extracted:', envVars.GEMINI_API_KEY ? envVars.GEMINI_API_KEY.slice(0, 10) + '...' : 'none');

const ai = new GoogleGenAI({ apiKey: envVars.GEMINI_API_KEY });

async function run() {
  try {
    const prompt = `System context: You are a medical prescription analysis assistant.
Raw OCR Text:
Rx: Amoxicillin 500mg TDS for 5 days. Paracetamol 650mg SOS.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            correctedText: { type: Type.STRING },
            summary: { type: Type.STRING },
            medicines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  frequency: { type: Type.STRING }
                },
                required: ['name', 'dosage', 'frequency']
              }
            },
            importantFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['correctedText', 'summary', 'medicines', 'importantFindings', 'tags']
        }
      }
    });

    console.log('Gemini response:');
    console.log(response.text);
  } catch (err) {
    console.error('Error occurred in Gemini call:');
    console.error(err);
  }
}

run();
