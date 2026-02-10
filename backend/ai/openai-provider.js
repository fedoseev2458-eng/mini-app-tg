const fs = require("fs");
const path = require("path");
const os = require("os");
const OpenAI = require("openai");
const { getRoomPrompt, getApartmentViewPrompts } = require("./prompts");
const { STYLES, BUDGETS } = require("./styles");
const { PROMPT_MAX_CHARS, APARTMENT_IMAGES_COUNT } = require("./config");
const { toPngForApi } = require("../image-utils");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Edit endpoint принимает только dall-e-2 (не gpt-image-1.5)
const IMAGE_EDIT_MODEL = "dall-e-2";

function truncatePrompt(p, max) {
  return p.length > max ? p.slice(0, max) : p;
}

function extFromMime(mimetype) {
  if (!mimetype) return "png";
  const m = mimetype.toLowerCase();
  if (m.includes("png")) return "png";
  if (m.includes("jpeg") || m.includes("jpg")) return "jpg";
  return "png";
}

/** Приводит буфер к формату, который принимает API (PNG или JPEG). Остальное конвертирует в PNG. */
async function prepareImageBuffer(buffer, mimetype) {
  const ext = extFromMime(mimetype);
  if (ext === "png" || ext === "jpg") return { buffer, ext };
  const png = await toPngForApi(buffer);
  return { buffer: png, ext: "png" };
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
    model: "dall-e-3",
    prompt: truncatePrompt(prompt, PROMPT_MAX_CHARS),
    size: "1024x1024",
    quality: "standard",
    style: "natural",
  }).then((result) => (result.data[0].url || "").trim());
}

class OpenAIProvider {
  async redesignRoom(imageBytes, roomType, style, budget, userText, mimetype = "") {
    const { buffer, ext } = await prepareImageBuffer(imageBytes, mimetype);
    const styleDesc = STYLES[style] || STYLES.minimalist;
    const budgetDesc = BUDGETS[budget] || BUDGETS.medium;
    const prompt = getRoomPrompt(roomType, styleDesc, budgetDesc, userText || "");
    const full = `Redesign this room. Keep the same layout and camera angle. ${prompt} Photorealistic interior.`;
    return editImage(buffer, full, `room.${ext}`);
  }

  async redesignApartment(planImageBytes, userPreferences, mimetype = "") {
    const { buffer, ext } = await prepareImageBuffer(planImageBytes, mimetype);
    const viewPrompts = getApartmentViewPrompts(userPreferences).slice(0, APARTMENT_IMAGES_COUNT);
    const images = [];
    for (let i = 0; i < viewPrompts.length; i++) {
      const full = `Based on this floor plan, generate a photorealistic interior photo. ${viewPrompts[i]} Professional interior photography, natural lighting.`;
      const url = await editImage(buffer, full, `plan_${i}.${ext}`);
      images.push(url);
    }
    return images;
  }
}

module.exports = OpenAIProvider;
