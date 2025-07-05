import { pensivePrompt } from "./api/endpoints";
import { exportResolvedQuery, ResolvedQuery } from "./components/pensive";

const SELECTED_MARKER = "<<< NOTE: this is the selected node >>>";
const TASK_DESCRIPTION = `
The above is an excerpt from a file of notes someone has written, structured
using nested bullet points in a markdown-like style. The user currently has one
of the bullet points selected, annotated by the following marker:

${SELECTED_MARKER}

The user has asked you to comment on the selected bullet point. For examples:

- If the selected bullet point is a question, answer the question if you are
  able
- If the selected bullet point mentions a problem that the user is stuck on,
  suggest some solutions or things to try

Where possible, be short and concise, and follow a conversational style. Where
possible, use the same style as the other bullet points:

- Use the same kind of language as the user has in their other bullet points
- Follow the same punctuation conventions
- Use the same terminology that the user has used in other bullet points, where
  appropriate

Do not include markdown syntax or an opening bullet point in your answer, as the
answer will be formatted for you. Only the text of your answer is necessary.
`;

export const useRunPrompt = () => {
  return (resolvedQuery: ResolvedQuery) => {
    const context = exportResolvedQuery(resolvedQuery, 1, 0, SELECTED_MARKER);

    return pensivePrompt(`${context}\n\n---\n\n${TASK_DESCRIPTION}`);
  };
};
