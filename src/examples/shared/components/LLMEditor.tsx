import { createComponent } from "../../../core/components/createComponent";

interface EditorProps {
  content: string;
  setContent: (value: string) => void;
}

export const LLMEditor = createComponent<EditorProps>(async (props) => {
  console.log("running llm editor");
  console.log("content:", props.content);
  const editedContent = `Edited: ${props.content}`;
  props.setContent(editedContent);
});
