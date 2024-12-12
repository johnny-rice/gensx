import React from "react";
import { LLMWriter } from "../shared/components/LLMWriter";
import { LLMEditor } from "../shared/components/LLMEditor";
import { createWorkflowOutput } from "../../core/hooks/useWorkflowOutput";
import { defineWorkflow } from "../../core/utils/workflow-builder";

interface TweetWritingWorkflowInputs {
  content: string | Promise<string>;
  setOutput: (value: string) => void;
}

interface TweetWritingWorkflowOutputs {
  output: string;
}

export const TweetWritingWorkflow = defineWorkflow<
  TweetWritingWorkflowInputs,
  TweetWritingWorkflowOutputs
>((props) => {
  // Writing phase
  const [draft, setDraft] = createWorkflowOutput<string>("");
  const [metadata, setMetadata] = createWorkflowOutput<{
    wordCount: number;
    readingTime: number;
    keywords: string[];
  }>({ wordCount: 0, readingTime: 0, keywords: [] });

  const element = (
    <>
      <LLMWriter
        content={props.content}
        setContent={setDraft}
        setMetadata={setMetadata}
      />
      <LLMEditor content={draft} setContent={props.setOutput} />
    </>
  );

  return {
    element,
    outputs: {
      output: { value: draft, setValue: props.setOutput },
    },
  };
});
