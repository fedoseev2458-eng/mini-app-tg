const sharp = require("sharp");

const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB — лимит OpenAI Edit API
const EDIT_SIZE = 1024; // DALL-E 2 Edit принимает только квадратные изображения

/**
 * Делает изображение квадратным (center crop), конвертирует в PNG, при необходимости
 * уменьшает размер файла до 4 MB. Edit API возвращает 400 на не-квадратных и больших файлах.
 */
async function toPngForApi(imageBuffer) {
  if (!imageBuffer || !Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
    throw new Error("Нет данных изображения");
  }
  const meta = await sharp(imageBuffer).metadata();
  const w = meta.width || 1024;
  const h = meta.height || 1024;
  const cropSize = Math.min(w, h);
  const left = Math.floor((w - cropSize) / 2);
  const top = Math.floor((h - cropSize) / 2);
  const extract = { left, top, width: cropSize, height: cropSize };

  for (const dim of [EDIT_SIZE, 768, 512, 256]) {
    const png = await sharp(imageBuffer)
      .extract(extract)
      .resize(dim, dim)
      .ensureAlpha()
      .png()
      .toBuffer();
    if (png.length <= MAX_SIZE_BYTES) return png;
  }
  return sharp(imageBuffer).extract(extract).resize(256, 256).ensureAlpha().png().toBuffer();
}

module.exports = { toPngForApi };
