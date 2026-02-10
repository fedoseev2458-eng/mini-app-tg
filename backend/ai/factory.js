const OpenAIProvider = require("./openai-provider");
const GeminiProvider = require("./gemini-provider");

function getAIProvider() {
  const provider = (process.env.AI_PROVIDER || "openai").trim().toLowerCase();
  if (provider === "gemini") return new GeminiProvider();
  return new OpenAIProvider();
}

module.exports = { getAIProvider };
