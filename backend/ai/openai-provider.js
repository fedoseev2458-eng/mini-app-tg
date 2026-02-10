const OpenAI = require("openai");
const { getRoomPrompt, getApartmentViewPrompts } = require("./prompts");
const { STYLES, BUDGETS } = require("./styles");
const { PROMPT_MAX_CHARS, APARTMENT_IMAGES_COUNT } = require("./config");
const { toPngForApi } = require("../image-utils");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EDIT_MODEL = "dall-e-2";

function truncatePrompt(p, max) {
  return p.length > max ? p.slice(0, max) : p;
}

async function editImage(imagePngBuffer, prompt, filename = "room.png") {
  const file = new File([imagePngBuffer], filename, { type: "image/png" });
  const data = await client.images.edit({
    model: EDIT_MODEL,
    image: file,
    prompt: truncatePrompt(prompt, PROMPT_MAX_CHARS),
    size: "1024x1024",
  });
  const d = data.data[0];
  if (d?.url) return d.url;
  if (d?.b64_json) return `data:image/png;base64,${d.b64_json}`;
  throw new Error("No image data");
}

class OpenAIProvider {
  async redesignRoom(imageBytes, roomType, style, budget, userText, _mimetype = "") {
    const styleDesc = STYLES[style] || STYLES.minimalist;
    const budgetDesc = BUDGETS[budget] || BUDGETS.medium;
    const prompt = getRoomPrompt(roomType, styleDesc, budgetDesc, userText || "");
    const full = `Redesign this room. Keep the same layout and camera angle. ${prompt} Photorealistic interior.`;
    const png = await toPngForApi(imageBytes);
    return editImage(png, full, "room.png");
  }

  async redesignApartment(planImageBytes, userPreferences, _mimetype = "") {
    const viewPrompts = getApartmentViewPrompts(userPreferences).slice(0, APARTMENT_IMAGES_COUNT);
    const png = await toPngForApi(planImageBytes);
    const images = [];
    for (let i = 0; i < viewPrompts.length; i++) {
      const full = `Based on this floor plan, generate a photorealistic interior photo. ${viewPrompts[i]} Professional interior photography, natural lighting.`;
      const url = await editImage(png, full, `plan_${i}.png`);
      images.push(url);
    }
    return images;
  }
}

module.exports = OpenAIProvider;
