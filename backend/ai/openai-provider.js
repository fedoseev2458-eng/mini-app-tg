const fs = require("fs");
const path = require("path");
const os = require("os");
const OpenAI = require("openai");
const { getRoomPrompt, getApartmentViewPrompts } = require("./prompts");
const { STYLES, BUDGETS } = require("./styles");
const { PROMPT_MAX_CHARS, APARTMENT_IMAGES_COUNT } = require("./config");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function truncatePrompt(p, max) {
  return p.length > max ? p.slice(0, max) : p;
}

async function editImage(imageBytes, prompt, filename = "room.jpg") {
  const tmpDir = os.tmpdir();
  const tmpPath = path.join(tmpDir, filename);
  fs.writeFileSync(tmpPath, imageBytes);
  try {
    const data = await client.images.edit({
      model: "gpt-image-1.5",
      image: fs.createReadStream(tmpPath),
      prompt: truncatePrompt(prompt, PROMPT_MAX_CHARS),
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
  async redesignRoom(imageBytes, roomType, style, budget, userText) {
    const styleDesc = STYLES[style] || STYLES.minimalist;
    const budgetDesc = BUDGETS[budget] || BUDGETS.medium;
    const prompt = getRoomPrompt(roomType, styleDesc, budgetDesc, userText || "");
    const full = `Redesign this room. Keep the same layout and camera angle. ${prompt} Photorealistic interior.`;
    return editImage(imageBytes, full);
  }

  async redesignApartment(planImageBytes, userPreferences) {
    const viewPrompts = getApartmentViewPrompts(userPreferences).slice(0, APARTMENT_IMAGES_COUNT);
    const images = [];
    for (const viewPrompt of viewPrompts) {
      const full = `Based on this floor plan, generate a photorealistic interior photo. ${viewPrompt} Professional interior photography, natural lighting.`;
      const url = await editImage(planImageBytes, full, "plan.jpg");
      images.push(url);
    }
    return images;
  }
}

module.exports = OpenAIProvider;
