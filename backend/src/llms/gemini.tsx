import { GoogleGenerativeAI } from "@google/generative-ai/dist/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? null;

export const runGeminiPrompt = async (prompt: string) => {
  if (GEMINI_API_KEY == null) {
    throw new Error("Gemini API key is not specified");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent(prompt);
  return await result.response.text;
};
