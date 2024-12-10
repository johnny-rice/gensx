import { createComponent } from "../../../core/components/createComponent";

interface WriterProps {
  content: string;
  setContent: (value: string) => void;
  setMetadata: (value: {
    wordCount: number;
    readingTime: number;
    keywords: string[];
  }) => void;
}

export const LLMWriter = createComponent<WriterProps>(
  async ({ content, setContent, setMetadata }) => {
    const processedContent = `Written content based on: ${content}`;
    const metadata = {
      wordCount: processedContent.split(" ").length,
      readingTime: Math.ceil(processedContent.split(" ").length / 200),
      keywords: ["sample", "content", "test"],
    };

    setContent(processedContent);
    setMetadata(metadata);
  }
);
