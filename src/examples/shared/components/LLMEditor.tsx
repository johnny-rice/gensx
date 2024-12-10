import { createComponent } from "../../../core/components/createComponent";

interface EditorProps {
  content: string;
  setContent: (value: string) => void;
}

export const LLMEditor = createComponent<EditorProps>(
  async ({ content, setContent }) => {
    const editedContent = `Edited content: ${content}`;
    setContent(editedContent);
    console.log("rendering llm editor");
  }
);
