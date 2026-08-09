import { createWorker } from 'tesseract.js';
import { preprocessImageHighContrast } from './preprocess';
import path from 'path';
import fs from 'fs';
import os from 'os';

let cachedWorker: any = null;

function findTrainedDataDir(): string | null {
  try {
    const cwd = process.cwd();
    const candidates = [
      path.join(cwd, 'public', 'tessdata'),
      path.join(cwd, 'public'),
      cwd,
      path.join(__dirname, '..', '..', '..', 'public', 'tessdata'),
      path.join(__dirname, '..', '..', '..', 'public'),
      path.join(__dirname, '..', '..', '..'),
    ];

    for (const dir of candidates) {
      if (fs.existsSync(path.join(dir, 'eng.traineddata'))) {
        return dir;
      }
    }
  } catch (err) {
    console.warn("Error scanning for traineddata dir:", err);
  }
  return null;
}

async function getOrInitWorker() {
  if (cachedWorker) {
    return cachedWorker;
  }

  const tmpDir = os.tmpdir();
  const trainedDataDir = findTrainedDataDir();

  if (trainedDataDir) {
    try {
      const worker = await createWorker('eng', 1, {
        langPath: trainedDataDir,
        cachePath: tmpDir,
        gzip: false,
        logger: () => {},
      });
      cachedWorker = worker;
      return cachedWorker;
    } catch (localErr) {
      console.warn("Local worker initialization failed, falling back to standard createWorker:", localErr);
    }
  }

  try {
    const worker = await createWorker('eng', 1, {
      cachePath: tmpDir,
      logger: () => {},
    });
    cachedWorker = worker;
    return cachedWorker;
  } catch (err) {
    console.warn("Fallback to basic createWorker:", err);
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
