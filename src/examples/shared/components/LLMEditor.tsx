import { createComponent } from "../../../core/components/createComponent";

interface EditorProps {
  content: string | Promise<string>;
  setContent: (value: string) => void;
}

export const LLMEditor = createComponent<EditorProps>(async (props) => {
  // props.content is guaranteed to be string by the framework
  console.log("running llm editor");
  console.log("content:", props.content);
  const editedContent = `Edited: ${props.content}`;
  props.setContent(editedContent);
});
