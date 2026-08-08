import sharp from 'sharp';

export async function preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize({ width: 2000, withoutEnlargement: true })
    .grayscale()
    .normalize()
    .sharpen()
    .modulate({ brightness: 1.1 })
    .png()
    .toBuffer();
}

export async function checkImageQuality(imageBuffer: Buffer): Promise<{ score: number; warnings: string[]; isAcceptable: boolean }> {
  const metadata = await sharp(imageBuffer).metadata();
  const warnings: string[] = [];
  let score = 100;

  if (!metadata.width || !metadata.height) {
    warnings.push("Image dimensions could not be read.");
    score -= 50;
  } else if (metadata.width < 500 || metadata.height < 500) {
    warnings.push("Image dimensions are too small (less than 500px).");
    score -= 20;
  }

  if (metadata.size && metadata.size < 50 * 1024) {
    warnings.push("File size is very small (less than 50KB), likely too compressed.");
    score -= 20;
  }

  const stats = await sharp(imageBuffer).stats();
  if (stats.channels[0]) {
    const mean = stats.channels[0].mean;
    if (mean < 50) {
      warnings.push("Image appears too dark.");
      score -= 15;
    } else if (mean > 200) {
      warnings.push("Image appears too bright.");
      score -= 15;
    }
  }

  const isAcceptable = score >= 50;

  return {
    score,
    warnings,
    isAcceptable,
  };
}
