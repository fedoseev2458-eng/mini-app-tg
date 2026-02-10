const OpenAI = require("openai");
const { getRoomPrompt, getApartmentViewPrompts } = require("./prompts");
const { STYLES, BUDGETS } = require("./styles");
const { PROMPT_MAX_CHARS, APARTMENT_IMAGES_COUNT } = require("./config");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Только DALL-E 3 (generate) — стабильно работает, без Edit API и 400
const IMAGE_MODEL = "dall-e-3";

function truncatePrompt(p, max) {
  return p.length > max ? p.slice(0, max) : p;
}

function generateImage(prompt) {
  return client.images
    .generate({
      model: IMAGE_MODEL,
      prompt: truncatePrompt(prompt, PROMPT_MAX_CHARS),
      size: "1024x1024",
      quality: "standard",
      style: "natural",
    })
    .then((result) => {
      const url = result.data[0]?.url || result.data[0]?.b64_json;
      if (result.data[0]?.b64_json) return `data:image/png;base64,${result.data[0].b64_json}`;
      return (url || "").trim();
    });
}

class OpenAIProvider {
  async redesignRoom(_imageBytes, roomType, style, budget, userText, _mimetype = "") {
    const styleDesc = STYLES[style] || STYLES.minimalist;
    const budgetDesc = BUDGETS[budget] || BUDGETS.medium;
    const prompt = getRoomPrompt(roomType, styleDesc, budgetDesc, userText || "");
    const full = `Photorealistic interior design photo. ${prompt} Same layout and camera angle. Natural lighting, professional photography.`;
    return generateImage(full);
  }

  async redesignApartment(_planImageBytes, userPreferences, _mimetype = "") {
    const viewPrompts = getApartmentViewPrompts(userPreferences).slice(0, APARTMENT_IMAGES_COUNT);
    const images = [];
    for (const viewPrompt of viewPrompts) {
      const full = `Photorealistic interior photo. ${viewPrompt} Professional interior photography, natural lighting.`;
      const url = await generateImage(full);
      images.push(url);
    }
    return images;
  }
}

module.exports = OpenAIProvider;
