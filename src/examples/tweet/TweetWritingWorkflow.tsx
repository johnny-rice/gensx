import React from "react";
import { LLMWriter } from "../shared/components/LLMWriter";
import { LLMEditor } from "../shared/components/LLMEditor";
import { useWorkflowOutput } from "../../core/hooks/useWorkflowOutput";
import { defineWorkflow } from "../../core/utils/workflow-builder";

interface TweetWritingWorkflowProps {
  content: string | Promise<string>;
  setOutput: (content: string) => void;
}

export const TweetWritingWorkflow = defineWorkflow<TweetWritingWorkflowProps>(
  ({ content, setOutput }) => {
    // Research phase
    const [getOutline, setOutline] = useWorkflowOutput<string>("");

    // Writing phase
    const [getDraft, setDraft] = useWorkflowOutput<string>("");
    const [getMetadata, setMetadata] = useWorkflowOutput<{
      wordCount: number;
      readingTime: number;
      keywords: string[];
    }>({ wordCount: 0, readingTime: 0, keywords: [] });

    return (
      <>
        {/* Writing Phase */}
        <LLMWriter
          content={content}
          setContent={setDraft}
          setMetadata={setMetadata}
        />

        {/* Editing Phase */}
        <LLMEditor content={getDraft()} setContent={setOutput} />
      </>
    );
  }
);
