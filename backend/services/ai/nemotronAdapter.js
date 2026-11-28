
const generateResponse = async (prompt) => {
  const startTime = Date.now();

  const response = await fetch(
    "https://integrate.api.nvidia.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3.5-super-vl-120b-a12b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        reasoning_effort: "low",
        max_tokens: 4096,
        stream: false,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || `NVIDIA API error: ${response.status}`
    );
  }

  const choice = data.choices?.[0];

  console.log(
    `Nemotron response time: ${(Date.now() - startTime) / 1000} seconds`
  );

  if (choice?.finish_reason === "length") {
    throw new Error("Nemotron response was truncated by the token limit.");
  }

  return choice?.message?.content || "";
};

module.exports = { generateResponse };
