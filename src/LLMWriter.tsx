import { createComponent } from "./createComponent";

interface WriterInputs {
  content: string;
}

export interface WriterOutputs {
  content: string;
  metadata: {
    wordCount: number;
    readingTime: number;
    keywords: string[];
  };
}

export const LLMWriter = createComponent<WriterInputs, WriterOutputs, any>(
  async ({ content }) => {
    const processedContent = `Written content based on: ${content}`;
    return {
      content: processedContent,
      metadata: {
        wordCount: processedContent.split(" ").length,
        readingTime: Math.ceil(processedContent.split(" ").length / 200),
        keywords: ["sample", "content", "test"],
      },
    };
  }
);
