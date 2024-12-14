import { createWorkflow } from "@/src/index";

interface WriterProps {
  content: string;
}

interface WriterOutput {
  content: string;
  metadata: {
    wordCount: number;
    readingTime: number;
    keywords: string[];
  };
}

export const LLMWriter = createWorkflow<WriterProps, WriterOutput>(
  // eslint-disable-next-line @typescript-eslint/require-await
  async (props, render) => {
    const processedContent = `Written content based on: ${props.content}`;
    const processedMetadata = {
      wordCount: processedContent.split(" ").length,
      readingTime: Math.ceil(processedContent.split(" ").length / 200),
      keywords: ["sample", "content", "test"],
    };

    return render({
      content: processedContent,
      metadata: processedMetadata,
    });
  },
);
