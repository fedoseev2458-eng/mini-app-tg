const fs = require("fs");
const path = require("path");
const os = require("os");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");
const {
  getRoomPrompt,
  getApartmentViewPrompts,
  getVisionAnalysisPrompt,
  getPlanAnalysisPrompt,
} = require("./prompts");
const { STYLES, BUDGETS } = require("./styles");
const { PROMPT_MAX_CHARS, APARTMENT_IMAGES_COUNT } = require("./config");

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function analyzeImage(imageBytes, prompt) {
  const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });
  const tmpPath = path.join(os.tmpdir(), "analyze.jpg");
  fs.writeFileSync(tmpPath, imageBytes);
  const imagePart = { inlineData: { data: imageBytes, mimeType: "image/jpeg" } };
  return model.generateContent([prompt, imagePart]).then((resp) => (resp.response?.text() || "").trim());
}

function generateImageFallback(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Promise.resolve("");
  const client = new OpenAI({ apiKey });
  const p = prompt.length > PROMPT_MAX_CHARS ? prompt.slice(0, PROMPT_MAX_CHARS) : prompt;
  return client.images
    .generate({
      model: "dall-e-3",
      prompt: p,
      size: "1024x1024",
      quality: "standard",
    })
    .then((result) => (result.data[0].url || "").trim())
    .catch(() => "");
}

class GeminiProvider {
  async redesignRoom(imageBytes, roomType, style, budget, userText) {
    const analysis = await analyzeImage(imageBytes, getVisionAnalysisPrompt());
    const styleDesc = STYLES[style] || STYLES.minimalist;
    const budgetDesc = BUDGETS[budget] || BUDGETS.medium;
    const prompt = getRoomPrompt(roomType, styleDesc, budgetDesc, userText || "");
    const fullPrompt = `Based on this room description: ${analysis}. ${prompt}`;
    const url = await generateImageFallback(fullPrompt);
    if (url) return url;
    throw new Error("Image generation: set OPENAI_API_KEY for DALL-E fallback or use AI_PROVIDER=openai.");
  }

  async redesignApartment(planImageBytes, userPreferences) {
    const analysis = await analyzeImage(planImageBytes, getPlanAnalysisPrompt());
    const viewPrompts = getApartmentViewPrompts(userPreferences).slice(0, APARTMENT_IMAGES_COUNT);
    const images = [];
    for (const viewPrompt of viewPrompts) {
      const fullPrompt = `Floor plan: ${analysis}. ${viewPrompt}`;
      const url = await generateImageFallback(fullPrompt);
      if (!url) throw new Error("Image generation: set OPENAI_API_KEY for DALL-E fallback or use AI_PROVIDER=openai.");
      images.push(url);
    }
    return images;
  }
}

module.exports = GeminiProvider;
