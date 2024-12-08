import { createComponent } from "./createComponent";

interface EditorInputs {
  content: string;
}

interface EditorOutputs {
  content: string;
}

export const LLMEditor = createComponent<EditorInputs, EditorOutputs, any>(
  async ({ content }) => {
    return {
      content: `Edited content: ${content}`,
    };
  }
);
