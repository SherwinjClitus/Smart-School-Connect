require("dotenv").config();

const gemini = require("./services/ai/geminiAdapter");
const nemotron = require("./services/ai/nemotronAdapter");

const prompt =
  "Explain what a school management system is and mention three important features. Use simple language in exactly three sentences.";

const testProvider = async (name, adapter) => {
  const start = Date.now();

  try {
    console.log(`\nTesting ${name}...`);

    const result = await adapter.generateResponse(prompt);

    return {
      provider: name,
      time: ((Date.now() - start) / 1000).toFixed(2) + " seconds",
      response: result,
      status: "Success",
    };
  } catch (error) {
    return {
      provider: name,
      time: ((Date.now() - start) / 1000).toFixed(2) + " seconds",
      response: error.message,
      status: "Failed",
    };
  }
};

const compareAI = async () => {
  const results = await Promise.all([
    testProvider("Gemini", gemini),
    testProvider("Nemotron", nemotron),
  ]);

  console.log("\n========== AI COMPARISON ==========");

  results.forEach((result) => {
    console.log(`\n${result.provider}`);
    console.log(`Status: ${result.status}`);
    console.log(`Time: ${result.time}`);
    console.log(`Response: ${result.response}`);
  });
};

compareAI();