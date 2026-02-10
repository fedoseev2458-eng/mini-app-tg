const fs = require("fs");
const path = require("path");
const os = require("os");
const OpenAI = require("openai");
const { getRoomPrompt, getApartmentViewPrompts } = require("./prompts");
const { STYLES, BUDGETS } = require("./styles");
const { PROMPT_MAX_CHARS, APARTMENT_IMAGES_COUNT } = require("./config");
const { toPngForApi } = require("../image-utils");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// DALL-E: edit = dall-e-2 (image-to-image), generate = dall-e-3 (text-to-image)
const IMAGE_EDIT_MODEL = "dall-e-2";
const IMAGE_GENERATE_MODEL = "dall-e-3";

function truncatePrompt(p, max) {
  return p.length > max ? p.slice(0, max) : p;
}

/** Всегда конвертируем в PNG — Edit API стабильно принимает только PNG. */
async function prepareImageForEdit(buffer) {
  const png = await toPngForApi(buffer);
  return png;
}

async function editImage(imageBytes, prompt, filename = "room.png") {
  const tmpDir = os.tmpdir();
  const tmpPath = path.join(tmpDir, filename);
  fs.writeFileSync(tmpPath, imageBytes);
  try {
    const data = await client.images.edit({
      model: IMAGE_EDIT_MODEL,
      image: fs.createReadStream(tmpPath),
      prompt: truncatePrompt(prompt, PROMPT_MAX_CHARS),
      size: "1024x1024",
    });
    const d = data.data[0];
    if (d.url) return d.url;
    if (d.b64_json) return `data:image/png;base64,${d.b64_json}`;
    throw new Error("No image data in response");
  } finally {
    try { fs.unlinkSync(tmpPath); } catch (_) {}
  }
}

function generateFromText(prompt) {
  return client.images.generate({
    model: IMAGE_GENERATE_MODEL,
    prompt: truncatePrompt(prompt, PROMPT_MAX_CHARS),
    size: "1024x1024",
    quality: "standard",
    style: "natural",
  }).then((result) => (result.data[0].url || "").trim());
}

class OpenAIProvider {
  async redesignRoom(imageBytes, roomType, style, budget, userText, _mimetype = "") {
    const buffer = await prepareImageForEdit(imageBytes);
    const styleDesc = STYLES[style] || STYLES.minimalist;
    const budgetDesc = BUDGETS[budget] || BUDGETS.medium;
    const prompt = getRoomPrompt(roomType, styleDesc, budgetDesc, userText || "");
    const full = `Redesign this room. Keep the same layout and camera angle. ${prompt} Photorealistic interior.`;
    return editImage(buffer, full, "room.png");
  }

  async redesignApartment(planImageBytes, userPreferences, _mimetype = "") {
    const buffer = await prepareImageForEdit(planImageBytes);
    const viewPrompts = getApartmentViewPrompts(userPreferences).slice(0, APARTMENT_IMAGES_COUNT);
    const images = [];
    for (let i = 0; i < viewPrompts.length; i++) {
      const full = `Based on this floor plan, generate a photorealistic interior photo. ${viewPrompts[i]} Professional interior photography, natural lighting.`;
      const url = await editImage(buffer, full, `plan_${i}.png`);
      images.push(url);
    }
    return images;
  }
}

module.exports = OpenAIProvider;
