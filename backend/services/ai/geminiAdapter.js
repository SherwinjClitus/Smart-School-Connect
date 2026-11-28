const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const generateResponse = async (prompt) => {
  const interaction = await ai.interactions.create({
    model: "gemini-3.8-flash",
    input: prompt,
    store: false,
    generation_config: {
      thinking_level: "low",
      max_output_tokens: 1024,
    },
  });

  return interaction.output_text;
};

module.exports = { generateResponse };
