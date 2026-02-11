const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { fileFromPath } = require("formdata-node/file-from-path");
const sharp = require("sharp");
const { getRoomPrompt, getApartmentViewPrompts } = require("./prompts");
const { STYLES, BUDGETS } = require("./styles");
const { PROMPT_MAX_CHARS, APARTMENT_IMAGES_COUNT } = require("./config");
const { toPngForApi, createMask, toPngWithTransparentEdges } = require("../image-utils");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EDIT_MODEL = "dall-e-2";

function truncatePrompt(p, max) {
  return p.length > max ? p.slice(0, max) : p;
}

async function editImage(imagePngBuffer, prompt, filename = "room.png", maskSize = 1024, useTransparentImage = false) {
  const tmpDir = os.tmpdir();
  const imagePath = path.join(tmpDir, `image_${Date.now()}_${filename}`);
  let maskPath = null;
  
  try {
    // Записываем изображение во временный файл
    if (useTransparentImage) {
      const imageWithTransparency = await toPngWithTransparentEdges(imagePngBuffer);
      fs.writeFileSync(imagePath, imageWithTransparency);
    } else {
      fs.writeFileSync(imagePath, imagePngBuffer);
    }
    
    // Создаём File объекты из файлов с правильным MIME типом
    const imageFile = await fileFromPath(imagePath, { type: "image/png" });
    
    let maskFile = null;
    if (!useTransparentImage) {
      const maskBuffer = await createMask(maskSize);
      maskPath = path.join(tmpDir, `mask_${Date.now()}.png`);
      fs.writeFileSync(maskPath, maskBuffer);
      maskFile = await fileFromPath(maskPath, { type: "image/png" });
    }
    
    // Убеждаемся, что промпт явно просит изменить изображение
    const enhancedPrompt = `Completely redesign and transform this image. ${truncatePrompt(prompt, PROMPT_MAX_CHARS - 100)} Generate a completely new and different design.`;
    
    const editParams = {
      model: EDIT_MODEL,
      image: imageFile,
      prompt: enhancedPrompt,
      size: "1024x1024",
      n: 1,
    };
    
    if (maskFile) {
      editParams.mask = maskFile;
    }
    
    const data = await client.images.edit(editParams);
    const d = data.data[0];
    if (d?.url) return d.url;
    if (d?.b64_json) return `data:image/png;base64,${d.b64_json}`;
    throw new Error("No image data");
  } finally {
    // Удаляем временные файлы
    try {
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      if (maskPath && fs.existsSync(maskPath)) fs.unlinkSync(maskPath);
    } catch (err) {
      console.error("Failed to cleanup temp files:", err);
    }
  }
}

class OpenAIProvider {
  async redesignRoom(imageBytes, roomType, style, budget, userText, _mimetype = "") {
    const styleDesc = STYLES[style] || STYLES.minimalist;
    const budgetDesc = BUDGETS[budget] || BUDGETS.medium;
    const prompt = getRoomPrompt(roomType, styleDesc, budgetDesc, userText || "");
    const full = `Completely redesign and transform this entire room image. Replace everything: all furniture, all decor, all colors, all materials. Create a completely new ${styleDesc} style ${roomType} interior design. ${prompt} The room must look completely different from the original while keeping the same camera angle and room layout structure. Generate a brand new interior design with ${styleDesc} furniture, ${styleDesc} colors, ${styleDesc} decor.`;
    const png = await toPngForApi(imageBytes);
    const meta = await sharp(png).metadata();
    const size = meta.width || 1024;
    return editImage(png, full, "room.png", size);
  }

  async redesignApartment(planImageBytes, userPreferences, _mimetype = "") {
    const viewPrompts = getApartmentViewPrompts(userPreferences).slice(0, APARTMENT_IMAGES_COUNT);
    const png = await toPngForApi(planImageBytes);
    const meta = await sharp(png).metadata();
    const size = meta.width || 1024;
    const images = [];
    for (let i = 0; i < viewPrompts.length; i++) {
      const full = `Based on this floor plan, generate a photorealistic interior photo. ${viewPrompts[i]} Professional interior photography, natural lighting.`;
      const url = await editImage(png, full, `plan_${i}.png`, size);
      images.push(url);
    }
    return images;
  }

  async redesignApartmentSingle(planImageBytes, userPreferences, index, _mimetype = "") {
    const viewPrompts = getApartmentViewPrompts(userPreferences);
    if (index < 0 || index >= viewPrompts.length) {
      throw new Error(`Invalid index: ${index}. Must be between 0 and ${viewPrompts.length - 1}`);
    }
    const png = await toPngForApi(planImageBytes);
    const meta = await sharp(png).metadata();
    const size = meta.width || 1024;
    const full = `Based on this floor plan, generate a photorealistic interior photo. ${viewPrompts[index]} Professional interior photography, natural lighting.`;
    return editImage(png, full, `plan_${index}.png`, size);
  }
}

module.exports = OpenAIProvider;
