const sharp = require("sharp");

const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB — лимит OpenAI Edit API

/**
 * Конвертирует в PNG и при необходимости уменьшает, чтобы уложиться в лимит API (4 MB).
 */
async function toPngForApi(imageBuffer) {
  if (!imageBuffer || !Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
    throw new Error("Нет данных изображения");
  }
  let img = sharp(imageBuffer).flatten({ background: { r: 255, g: 255, b: 255 } });
  let png = await img.png().toBuffer();
  if (png.length <= MAX_SIZE_BYTES) return png;

  const meta = await sharp(imageBuffer).metadata();
  let width = meta.width || 1024;
  let height = meta.height || 1024;
  for (let i = 0; i < 5; i++) {
    width = Math.round(width * 0.75);
    height = Math.round(height * 0.75);
    if (width < 256 || height < 256) break;
    png = await sharp(imageBuffer).resize(width, height).flatten({ background: { r: 255, g: 255, b: 255 } }).png().toBuffer();
    if (png.length <= MAX_SIZE_BYTES) return png;
  }
  return png;
}

module.exports = { toPngForApi };
