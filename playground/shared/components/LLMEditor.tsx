import { createWorkflow } from "@/src/index";

interface EditorProps {
  content: string;
}

export const LLMEditor = createWorkflow<EditorProps, string>(
  // eslint-disable-next-line @typescript-eslint/require-await
  async (props, render) => {
    const editedContent = `Edited: ${props.content}`;
    return render(editedContent);
  },
);
