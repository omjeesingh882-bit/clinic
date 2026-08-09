import { GoogleGenAI, Type } from '@google/genai';
import { parseMedicalPrescription, ParsedPrescription } from '@/lib/ocr/parser';

export interface AIResult {
  correctedText: string;
  summary: string;
  medicines: { name: string; dosage: string; frequency: string; uncertain?: boolean }[];
  importantFindings: string[];
  tags: string[];
}

export async function analyzeWithGemini(
  rawOcrText: string,
  imageBuffer?: Buffer
): Promise<AIResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // If no API key is set, immediately use the high-precision medical parser
  if (!apiKey) {
    console.log("No GEMINI_API_KEY found, using local prescription parser.");
    return parseMedicalPrescription(rawOcrText);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an expert clinical medical prescription analysis assistant.
Analyze the following prescription text extracted via OCR.
Tasks:
1. Correct any minor OCR spelling errors for medical drug names, dosages, and patient instructions.
2. Extract all medications with accurate brand/generic names, dosages (e.g. 500mg, 10ml, 1 tab), and frequencies (e.g. 1-0-1, BD, TDS, SOS, before/after meals).
3. Generate a concise medical summary.
4. Extract important clinical findings, precautions, and warnings (e.g. complete antibiotic course, taking antacids before breakfast, SOS fever instructions).
5. Generate relevant medical tags (e.g. Antibiotic, Antipyretic, Respiratory, Gastrointestinal, Diabetic Care, Cardiovascular, Pediatric).
6. NEVER hallucinate missing medications. If text is unreadable or uncertain, mark uncertain.

Raw OCR Text:
${rawOcrText}`;

    // Try primary model
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
                  frequency: { type: Type.STRING },
                  uncertain: { type: Type.BOOLEAN }
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

    if (response.text) {
      const parsed = JSON.parse(response.text) as AIResult;
      // If Gemini returned empty medicines but raw text has content, blend with parser
      if ((!parsed.medicines || parsed.medicines.length === 0) && rawOcrText.trim().length > 10) {
        const fallback = parseMedicalPrescription(rawOcrText);
        if (fallback.medicines.length > 0) {
          parsed.medicines = fallback.medicines;
          if (!parsed.tags || parsed.tags.length === 0) parsed.tags = fallback.tags;
        }
      }
      return parsed;
    }
    
    throw new Error("Empty response from Gemini");
  } catch (error: any) {
    console.warn("Gemini AI API unavailable or quota exceeded, using local medical parser:", error?.message || error);
    // Graceful fallback to medical parser
    return parseMedicalPrescription(rawOcrText);
  }
}
