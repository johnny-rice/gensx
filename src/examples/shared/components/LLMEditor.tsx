import { createWorkflow } from "../../../core/utils/workflow-builder";
import { createWorkflowOutput } from "../../../core/hooks/useWorkflowOutput";

interface EditorProps {
  content: string;
  setContent: (value: string) => void;
}

interface EditorOutputs {
  content: string;
}

export const LLMEditor = createWorkflow<EditorProps, EditorOutputs>((props) => {
  const [content, setContent] = createWorkflowOutput<string>("");

  const editedContent = `Edited: ${props.content}`;
  setContent(editedContent);

  // Forward output to parent if setter was provided
  if (props.setContent) {
    content.then(props.setContent);
  }

  return {
    element: null,
    outputs: {
      content: { value: content, setValue: setContent },
    },
  };
});
