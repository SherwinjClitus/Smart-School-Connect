require("dotenv").config();

const { generateResponse } = require("./services/ai/geminiAdapter");

const testGemini = async () => {
  try {
    const startTime = Date.now();

    const result = await generateResponse(
      "Explain what a school management system is in two sentences.",
    );

    const endTime = Date.now();

    console.log("\nGemini response:");
    console.log(result);

    console.log(`\nResponse time: ${(endTime - startTime) / 1000} seconds`);
  } catch (error) {
    console.error("Gemini test failed:", error.message);
  }
};

testGemini();
