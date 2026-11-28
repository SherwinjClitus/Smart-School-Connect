
const gemini = require("./ai/geminiAdapter");
const nemotron = require("./ai/nemotronAdapter");

const generateAIResponse = async (provider, prompt) => {
  const selectedProvider = (provider || "nemotron").toLowerCase();

  if (!prompt || !prompt.trim()) {
    throw new Error("Prompt cannot be empty.");
  }

  let adapter;

  switch (selectedProvider) {
    case "gemini":
      adapter = gemini;
      break;

    case "nemotron":
      adapter = nemotron;
      break;

    default:
      throw new Error("Unsupported AI provider.");
  }

  return await adapter.generateResponse(prompt);
};

module.exports = { generateAIResponse };

