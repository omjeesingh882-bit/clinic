import { createWorker } from 'tesseract.js';

export async function performOCR(imageBuffer: Buffer): Promise<{ text: string; confidence: number }> {
  let worker;
  try {
    worker = await createWorker('eng');
    const result = await worker.recognize(imageBuffer);
    
    const text = result.data.text;
    const confidence = result.data.confidence;

    return { text, confidence };
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Failed to perform OCR on the image.");
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}
