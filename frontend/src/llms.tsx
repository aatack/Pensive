import { exportResolvedQuery, ResolvedQuery } from "./components/pensive"


export const usePrompt = () => {
  return (resolvedQuery: ResolvedQuery) => {
    const prompt = exportResolvedQuery(resolvedQuery)
  }
}