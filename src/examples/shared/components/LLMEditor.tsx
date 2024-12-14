import { createWorkflow } from "../../../core/utils/workflow-builder";

interface EditorProps {
  content: string;
}

export const LLMEditor = createWorkflow<EditorProps, string>(
  async (props, render) => {
    const editedContent = `Edited: ${props.content}`;
    return render(editedContent);
  }
);
