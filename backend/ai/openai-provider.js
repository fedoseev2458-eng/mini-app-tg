const fs = require("fs");
const path = require("path");
const os = require("os");
const OpenAI = require("openai");
const { getRoomPrompt, getApartmentViewPrompts } = require("./prompts");
const { STYLES, BUDGETS } = require("./styles");
const { PROMPT_MAX_CHARS, APARTMENT_IMAGES_COUNT } = require("./config");
const { toPngForApi } = require("../image-utils");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EDIT_MODEL = "dall-e-2";
const GENERATE_MODEL = "dall-e-3";

function truncatePrompt(p, max) {
  return p.length > max ? p.slice(0, max) : p;
}

function generateImage(prompt) {
  return client.images
    .generate({
      model: GENERATE_MODEL,
      prompt: truncatePrompt(prompt, PROMPT_MAX_CHARS),
      size: "1024x1024",
      quality: "standard",
      style: "natural",
    })
    .then((result) => {
      const d = result.data[0];
      if (d?.b64_json) return `data:image/png;base64,${d.b64_json}`;
      return (d?.url || "").trim();
    });
}

async function editImage(imagePngBuffer, prompt, filename = "room.png") {
  const tmpDir = os.tmpdir();
  const tmpPath = path.join(tmpDir, filename);
  fs.writeFileSync(tmpPath, imagePngBuffer);
  try {
    const data = await client.images.edit({
      model: EDIT_MODEL,
      image: fs.createReadStream(tmpPath),
      prompt: truncatePrompt(prompt, PROMPT_MAX_CHARS),
      size: "1024x1024",
    });
    const d = data.data[0];
    if (d?.url) return d.url;
    if (d?.b64_json) return `data:image/png;base64,${d.b64_json}`;
    throw new Error("No image data");
  } finally {
    try { fs.unlinkSync(tmpPath); } catch (_) {}
  }
}

class OpenAIProvider {
  async redesignRoom(imageBytes, roomType, style, budget, userText, _mimetype = "") {
    const styleDesc = STYLES[style] || STYLES.minimalist;
    const budgetDesc = BUDGETS[budget] || BUDGETS.medium;
    const prompt = getRoomPrompt(roomType, styleDesc, budgetDesc, userText || "");
    const full = `Redesign this room. Keep the same layout and camera angle. ${prompt} Photorealistic interior.`;

    try {
      const png = await toPngForApi(imageBytes);
      return await editImage(png, full, "room.png");
    } catch (err) {
      const fallback = `Photorealistic interior design. ${prompt} Natural lighting, professional photography.`;
      return generateImage(fallback);
    }
  }

  async redesignApartment(planImageBytes, userPreferences, _mimetype = "") {
    const viewPrompts = getApartmentViewPrompts(userPreferences).slice(0, APARTMENT_IMAGES_COUNT);
    const images = [];

    try {
      const png = await toPngForApi(planImageBytes);
      for (let i = 0; i < viewPrompts.length; i++) {
        const full = `Based on this floor plan, generate a photorealistic interior photo. ${viewPrompts[i]} Professional interior photography, natural lighting.`;
        try {
          const url = await editImage(png, full, `plan_${i}.png`);
          images.push(url);
        } catch (_) {
          const fallback = `Photorealistic interior. ${viewPrompts[i]} Natural lighting.`;
          images.push(await generateImage(fallback));
        }
      }
    } catch (_) {
      for (const viewPrompt of viewPrompts) {
        images.push(await generateImage(`Photorealistic interior. ${viewPrompt} Natural lighting.`));
      }
    }
    return images;
  }
}

module.exports = OpenAIProvider;
