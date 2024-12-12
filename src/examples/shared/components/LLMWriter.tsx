import { createWorkflow } from "../../../core/utils/workflow-builder";
import { createWorkflowOutput } from "../../../core/hooks/useWorkflowOutput";

interface WriterProps {
  content: string;
  setContent: (value: string) => void;
  setMetadata: (value: {
    wordCount: number;
    readingTime: number;
    keywords: string[];
  }) => void;
}

interface WriterOutputs {
  content: string;
  metadata: {
    wordCount: number;
    readingTime: number;
    keywords: string[];
  };
}

export const LLMWriter = createWorkflow<WriterProps, WriterOutputs>((props) => {
  const [content, setContent] = createWorkflowOutput<string>("");
  const [metadata, setMetadata] = createWorkflowOutput<{
    wordCount: number;
    readingTime: number;
    keywords: string[];
  }>({ wordCount: 0, readingTime: 0, keywords: [] });

  const processedContent = `Written content based on: ${props.content}`;
  const processedMetadata = {
    wordCount: processedContent.split(" ").length,
    readingTime: Math.ceil(processedContent.split(" ").length / 200),
    keywords: ["sample", "content", "test"],
  };

  setContent(processedContent);
  setMetadata(processedMetadata);

  // Forward outputs to parent if setters were provided
  if (props.setContent) {
    content.then(props.setContent);
  }
  if (props.setMetadata) {
    metadata.then(props.setMetadata);
  }

  return {
    element: null,
    outputs: {
      content: { value: content, setValue: setContent },
      metadata: { value: metadata, setValue: setMetadata },
    },
  };
});
