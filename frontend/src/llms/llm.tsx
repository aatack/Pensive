export type Part = string | Blob;

export type Llm = {
  runPrompt: (parts: Part[]) => Part[];
};
