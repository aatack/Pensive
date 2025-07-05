import { pensivePrompt } from "./api/endpoints";
import { exportResolvedQuery, ResolvedQuery } from "./components/pensive";
import { FrameState } from "./components/tab";
import { useWrite } from "./context/hooks";
import { last } from "./helpers/arrays";
import { generateUuid } from "./helpers/uuid";

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

Feel free to include markdown syntax (like code blocks or bold bits) as needed,
but do not include the leading bullet point: one will be added to the answer for
you.
`;

export const useRunPrompt = () => {
  const write = useWrite();

  return async (resolvedQuery: ResolvedQuery, frame: FrameState) => {
    const context = exportResolvedQuery(resolvedQuery, 1, 0, SELECTED_MARKER);

    const childUuid = generateUuid();
    const parentUuid = last(frame.selection) ?? frame.entityId;

    write({
      [childUuid]: { inbound: `+${parentUuid}`, llmContext: frame },
      [parentUuid]: { outbound: `+${childUuid}` },
    });
    // selection.reset([...createEntity.value.path, childUuid]);

    const response = await pensivePrompt(
      `${context}\n\n---\n\n${TASK_DESCRIPTION}`
    );

    write({ [childUuid]: { text: response } });
  };
};
