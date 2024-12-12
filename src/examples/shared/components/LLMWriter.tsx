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

export const LLMWriter = createComponent<WriterProps>(async (props) => {
  console.log("component: LLMWriter starting with content:", props.content);
  const processedContent = `Written content based on: ${props.content}`;
  const metadata = {
    wordCount: processedContent.split(" ").length,
    readingTime: Math.ceil(processedContent.split(" ").length / 200),
    keywords: ["sample", "content", "test"],
  };

  console.log("component: LLMWriter setting content:", processedContent);
  props.setContent(processedContent);
  props.setMetadata(metadata);
  console.log("component: LLMWriter completed");
});
