import sharp from 'sharp';

export async function preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    let pipeline = image.rotate(); // Automatically handles EXIF orientation

    // Optimize size for OCR (keep width between 1600 and 2400px for best character recognition)
    if (metadata.width && metadata.width > 2400) {
      pipeline = pipeline.resize({ width: 2400, withoutEnlargement: true });
    } else if (metadata.width && metadata.width < 1000) {
      pipeline = pipeline.resize({ width: 1600 });
    }

    return await pipeline
      .grayscale()
      .normalize()
      .sharpen()
      .modulate({ brightness: 1.05, saturation: 1.0 })
      .png({ compressionLevel: 6 })
      .toBuffer();
  } catch (error) {
    console.warn("Preprocessing fallback to original buffer:", error);
    return imageBuffer;
  }
}

export async function checkImageQuality(imageBuffer: Buffer): Promise<{ score: number; warnings: string[]; isAcceptable: boolean }> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const warnings: string[] = [];
    let score = 100;

    if (!metadata.width || !metadata.height) {
      warnings.push("Image dimensions could not be read.");
      score -= 30;
    } else if (metadata.width < 400 || metadata.height < 400) {
      warnings.push("Image resolution is low (less than 400px). Text might be unclear.");
      score -= 15;
    }

    try {
      const stats = await sharp(imageBuffer).stats();
      if (stats.channels && stats.channels[0]) {
        const mean = stats.channels[0].mean;
        if (mean < 40) {
          warnings.push("Image appears underexposed (too dark).");
          score -= 15;
        } else if (mean > 245) {
          warnings.push("Image appears overexposed (too bright).");
          score -= 10;
        }
      }
    } catch {
      // stats error can be ignored
    }

    score = Math.max(10, Math.min(100, score));
    const isAcceptable = score >= 40;

    return {
      score,
      warnings,
      isAcceptable,
    };
  } catch (error) {
    console.warn("Quality check fallback:", error);
    return {
      score: 80,
      warnings: [],
      isAcceptable: true,
    };
  }
}
