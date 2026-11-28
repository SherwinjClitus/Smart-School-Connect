require("dotenv").config();

const { generateAIResponse } = require("./services/aiService");

const test = async () => {
  try {
    const result = await generateAIResponse(
      "nemotron",
      "Explain the purpose of homework management in a school in two sentences.",
    );

    console.log("\nAI Service Response:");
    console.log(result);
  } catch (error) {
    console.error("AI Service Error:", error.message);
  }
};

test();
