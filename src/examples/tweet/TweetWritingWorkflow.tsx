import React, { useEffect } from "react";
import { LLMWriter } from "../shared/components/LLMWriter";
import {
  useWorkflowOutput,
  outputDependencies,
} from "../../core/hooks/useWorkflowOutput";

interface TweetWritingWorkflowProps {
  content: string;
  setOutput: (content: string) => void;
}

export function TweetWritingWorkflow({
  content,
  setOutput,
}: TweetWritingWorkflowProps) {
  const [getTweetMetadata, setTweetMetadata] = useWorkflowOutput<{
    wordCount: number;
    readingTime: number;
    keywords: string[];
  }>({
    wordCount: 0,
    readingTime: 0,
    keywords: [],
  });

  return (
    <LLMWriter
      content={content}
      setContent={setOutput}
      setMetadata={setTweetMetadata}
    />
  );
}
