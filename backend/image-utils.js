const sharp = require("sharp");

/**
 * Конвертирует любой формат изображения в PNG для OpenAI Edit API (принимает только PNG).
 */
async function toPngForApi(imageBuffer) {
  if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) return imageBuffer;
  try {
    return await sharp(imageBuffer)
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .png()
      .toBuffer();
  } catch (err) {
    console.warn("Image convert to PNG failed:", err.message);
    return imageBuffer;
  }
}

module.exports = { toPngForApi };
