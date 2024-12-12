import { createComponent } from "../../../core/components/createComponent";

interface EditorProps {
  content: string;
  setContent: (value: string) => void;
}

export const LLMEditor = createComponent<EditorProps>(async (props) => {
  const editedContent = `Edited: ${props.content}`;
  props.setContent(editedContent);
});
