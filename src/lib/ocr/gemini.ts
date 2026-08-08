import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AIResult {
  correctedText: string;
  summary: string;
  medicines: { name: string; dosage: string; frequency: string }[];
  importantFindings: string[];
  tags: string[];
}

export async function analyzeWithGemini(rawOcrText: string): Promise<AIResult> {
  try {
    const prompt = `System context: You are a medical prescription analysis assistant.
Instructions:
- Correct OCR errors in the prescription text.
- Extract all medicines with their dosages and frequencies.
- Generate a concise medical summary.
- Identify important findings or warnings.
- Generate relevant medical tags (e.g., Fever, Antibiotic, Pediatric).
- NEVER hallucinate missing information.
- Prefix uncertain medicine names with "Possibly".
- If text is unreadable, preserve it with a note.

Raw OCR Text:
${rawOcrText}`;

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

    if (response.text) {
      return JSON.parse(response.text) as AIResult;
    }
    throw new Error("No response text from Gemini");
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return {
      correctedText: rawOcrText,
      summary: "Failed to analyze prescription. Please check the raw OCR text.",
      medicines: [],
      importantFindings: [],
      tags: ["Error"]
    };
  }
}
