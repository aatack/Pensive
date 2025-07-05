import { exportResolvedQuery, ResolvedQuery } from "./components/pensive";

export const useRunPrompt = () => {
  return (resolvedQuery: ResolvedQuery) => {
    const prompt = exportResolvedQuery(
      resolvedQuery,
      1,
      0,
      "<<< NOTE: this is the selected node >>>"
    );

    console.log(prompt);
  };
};
