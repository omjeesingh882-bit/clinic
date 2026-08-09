import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { processImage } from '../src/actions/prescriptions.ts';

// read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    value = value.trim().replace(/^['"](.*)['"]$/, '$1');
    process.env[match[1]] = value;
  }
}

async function testProcessImage() {
  try {
    console.log('Generating test prescription image...');
    const svg = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ffffff"/>
        <text x="50" y="80" font-family="Helvetica, Arial, sans-serif" font-size="28" font-weight="bold" fill="#1e293b">APOLLO CLINIC</text>
        <text x="50" y="120" font-family="Helvetica, Arial, sans-serif" font-size="16" fill="#64748b">Dr. Sarah Jenkins, MD (General Medicine)</text>
        <line x1="50" y1="140" x2="750" y2="140" stroke="#cbd5e1" stroke-width="2"/>
        <text x="50" y="180" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="bold" fill="#0f172a">Rx:</text>
        <text x="80" y="220" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="#334155">1. Tab Augmentin 625mg - 1 tablet twice daily after food for 5 days</text>
        <text x="80" y="270" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="#334155">2. Tab Dolo 650mg - 1 tablet TDS when required for fever</text>
        <text x="80" y="320" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="#334155">3. Syrup Ascoril LS - 10ml thrice daily for 5 days</text>
        <text x="80" y="370" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="#334155">4. Cap Pan-D - 1 capsule once daily before breakfast for 5 days</text>
        <line x1="50" y1="430" x2="750" y2="430" stroke="#cbd5e1" stroke-width="2"/>
        <text x="50" y="470" font-family="Helvetica, Arial, sans-serif" font-size="16" fill="#475569">Advice: Drink warm water, rest, review after 5 days.</text>
      </svg>
    `;
    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
    const base64 = `data:image/png;base64,${buffer.toString('base64')}`;

    console.log('Calling processImage...');
    const result = await processImage(base64);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error in testProcessImage:', err);
  }
}

testProcessImage();
