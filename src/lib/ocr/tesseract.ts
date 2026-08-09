import { createWorker } from 'tesseract.js';
import { preprocessImageHighContrast } from './preprocess';

let cachedWorker: any = null;
let isWorkerInitializing = false;

async function getOrInitWorker() {
  if (cachedWorker) {
    return cachedWorker;
  }

  const cwd = process.cwd();
  try {
    const worker = await createWorker('eng', 1, {
      langPath: cwd,
      gzip: false,
      logger: () => {},
    });
    cachedWorker = worker;
    return cachedWorker;
  } catch (localErr) {
    console.warn("Local worker initialization fallback to remote/standard worker:", localErr);
    const worker = await createWorker('eng');
    cachedWorker = worker;
    return cachedWorker;
  }
}

export async function performOCR(
  imageBuffer: Buffer,
  originalBuffer?: Buffer
): Promise<{ text: string; confidence: number }> {
  try {
    const worker = await getOrInitWorker();
    let result = await worker.recognize(imageBuffer);

    let rawText = (result.data.text || '').trim();
    let confidence = Math.round(result.data.confidence || 75);

    // If text is very short or confidence is low and we have the raw/contrast option, try high-contrast pass
    if (rawText.length < 20 && originalBuffer) {
      try {
        const highContrastBuffer = await preprocessImageHighContrast(originalBuffer);
        const pass2 = await worker.recognize(highContrastBuffer);
        const pass2Text = (pass2.data.text || '').trim();
        if (pass2Text.length > rawText.length) {
          rawText = pass2Text;
          confidence = Math.max(confidence, Math.round(pass2.data.confidence || 70));
        }
      } catch (pass2Err) {
        console.warn("Second-pass OCR failed:", pass2Err);
      }
    }

    return {
      text: rawText,
      confidence: Math.max(10, Math.min(100, confidence))
    };
  } catch (error) {
    console.error("OCR Execution Error:", error);
    // Invalidate cached worker so next request can re-initialize fresh
    if (cachedWorker) {
      try {
        await cachedWorker.terminate();
      } catch {}
      cachedWorker = null;
    }

    return {
      text: "OCR extraction could not detect clear text.",
      confidence: 30
    };
  }
}
