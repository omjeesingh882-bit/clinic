import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

async function testTesseract() {
  try {
    console.log('Generating test image with text...');
    // Create an SVG image with text and convert to PNG buffer using sharp
    const svg = `
      <svg width="600" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        <text x="30" y="60" font-family="Arial" font-size="28" fill="black">Rx: Amoxicillin 500mg</text>
        <text x="30" y="110" font-family="Arial" font-size="24" fill="black">Take 1 capsule 3 times daily for 7 days</text>
        <text x="30" y="160" font-family="Arial" font-size="20" fill="black">Dr. John Smith, MD</text>
      </svg>
    `;
    const imageBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
    console.log('Test image generated, buffer size:', imageBuffer.length);

    console.log('Starting Tesseract worker...');
    const worker = await createWorker('eng');
    console.log('Worker initialized, recognizing text...');
    const result = await worker.recognize(imageBuffer);
    console.log('OCR Confidence:', result.data.confidence);
    console.log('OCR Text result:\n', result.data.text);
    await worker.terminate();
    console.log('Tesseract test successful!');
  } catch (err) {
    console.error('Tesseract test failed:', err);
  }
}

testTesseract();
