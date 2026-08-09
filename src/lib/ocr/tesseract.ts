import { createWorker } from 'tesseract.js';
import path from 'path';

export async function performOCR(imageBuffer: Buffer): Promise<{ text: string; confidence: number }> {
  let worker;
  try {
    const cwd = process.cwd();

    // Create worker using local traineddata first for high-speed offline performance
    try {
      worker = await createWorker('eng', 1, {
        langPath: cwd,
        gzip: false,
        logger: () => {}, // suppress verbose logs
      });
    } catch (localError) {
      console.warn("Local traineddata worker creation fallback to default:", localError);
      worker = await createWorker('eng');
    }

    const result = await worker.recognize(imageBuffer);
    
    const rawText = result.data.text || '';
    const confidence = Math.round(result.data.confidence || 75);

    return { 
      text: rawText.trim(), 
      confidence: Math.max(10, Math.min(100, confidence)) 
    };
  } catch (error) {
    console.error("OCR Error:", error);
    return {
      text: "OCR extraction could not detect clear text.",
      confidence: 30
    };
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (termErr) {
        console.warn("Error terminating worker:", termErr);
      }
    }
  }
}
