import { createComponent } from "../../../core/components/createComponent";

interface WriterProps {
  content: string | Promise<string>;
  setContent: (value: string) => void;
  setMetadata: (value: {
    wordCount: number;
    readingTime: number;
    keywords: string[];
  }) => void;
}

export const LLMWriter = createComponent<WriterProps>(async (props) => {
  // props.content is guaranteed to be string by the framework
  const processedContent = `Written content based on: ${props.content}`;
  const metadata = {
    wordCount: processedContent.split(" ").length,
    readingTime: Math.ceil(processedContent.split(" ").length / 200),
    keywords: ["sample", "content", "test"],
  };

  props.setContent(processedContent);
  props.setMetadata(metadata);
});
