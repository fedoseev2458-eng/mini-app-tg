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

/**
 * Создаёт версию изображения с прозрачными областями по краям для Edit API без маски.
 * Прозрачные области будут редактироваться согласно промпту.
 */
async function toPngWithTransparentEdges(imageBuffer, edgeSizePercent = 5) {
  const png = await toPngForApi(imageBuffer);
  const meta = await sharp(png).metadata();
  const size = meta.width || 1024;
  const edgeSize = Math.max(10, Math.floor(size * edgeSizePercent / 100));
  
  // Создаём маску с прозрачными краями
  const mask = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: Buffer.from([255, 255, 255, 255]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        left: edgeSize,
        top: edgeSize,
      },
    ])
    .extract({
      left: edgeSize,
      top: edgeSize,
      width: size - edgeSize * 2,
      height: size - edgeSize * 2,
    })
    .extend({
      top: edgeSize,
      bottom: edgeSize,
      left: edgeSize,
      right: edgeSize,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize(size, size)
    .png()
    .toBuffer();
  
  // Применяем маску к изображению
  return sharp(png)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

/**
 * Создаёт полностью белую маску для Edit API.
 * Белые пиксели = области для редактирования (всё изображение).
 * Размер должен точно совпадать с размером изображения.
 */
async function createMask(size) {
  // Создаём полностью белое изображение с альфа-каналом
  // Белый цвет (255,255,255) в маске означает "редактировать эту область"
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1.0 },
    },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

module.exports = { toPngForApi, createMask, toPngWithTransparentEdges };
