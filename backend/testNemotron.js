
require("dotenv").config();

const { generateResponse } = require("./services/ai/nemotronAdapter");

const testNemotron = async () => {
  try {
    const startTime = Date.now();

    const result = await generateResponse(
      "Explain what a school management system is in two sentences."
    );

    console.log("\nNemotron response:");
    console.log(result);

    console.log(
      `\nTotal response time: ${(Date.now() - startTime) / 1000} seconds`
    );
  } catch (error) {
    console.error("\nNemotron test failed:", error.message);
  }
};

testNemotron();
