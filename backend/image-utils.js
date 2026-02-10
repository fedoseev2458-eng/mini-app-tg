const sharp = require("sharp");

/**
 * Конвертирует буфер изображения в JPEG для API.
 * Поддерживаются: JPEG, PNG, WebP, GIF, AVIF, TIFF, BMP и др. (всё, что умеет sharp).
 * Возвращает Buffer (JPEG). Если конвертация не удалась — возвращает исходный буфер, если он уже JPEG/PNG.
 */
async function toJpegForApi(imageBuffer) {
  if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) return imageBuffer;
  try {
    const jpeg = await sharp(imageBuffer)
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 92 })
      .toBuffer();
    return jpeg;
  } catch (err) {
    console.warn("Image convert to JPEG failed, using original:", err.message);
    return imageBuffer;
  }
}

module.exports = { toJpegForApi };
