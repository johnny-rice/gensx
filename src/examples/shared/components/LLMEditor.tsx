import { createComponent } from "../../../core/components/createComponent";

interface EditorProps {
  content: string;
  setContent: (value: string) => void;
}

export const LLMEditor = createComponent<EditorProps>(async (props) => {
  console.log("component: LLMEditor starting with content:", props.content);
  const editedContent = `Edited: ${props.content}`;
  console.log("component: LLMEditor setting content:", editedContent);
  props.setContent(editedContent);
  console.log("component: LLMEditor completed");
});
