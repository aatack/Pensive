const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export const runGeminiPrompt = async (prompt: string): Promise<string> => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is not specified");
  }

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No response text returned from Gemini");
  }

  return text;
};
