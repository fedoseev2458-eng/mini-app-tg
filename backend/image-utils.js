const sharp = require("sharp");

/**
 * Конвертирует любой формат изображения в PNG для OpenAI Edit API (принимает только PNG).
 */
async function toPngForApi(imageBuffer) {
  if (!imageBuffer || !Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
    throw new Error("Нет данных изображения");
  }
  return sharp(imageBuffer)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toBuffer();
}

module.exports = { toPngForApi };
