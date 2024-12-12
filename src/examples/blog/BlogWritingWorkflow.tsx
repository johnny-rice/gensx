import React from "react";
import { LLMResearcher } from "../shared/components/LLMResearcher";
import { LLMWriter } from "../shared/components/LLMWriter";
import { LLMEditor } from "../shared/components/LLMEditor";
import { createWorkflowOutput } from "../../core/hooks/useWorkflowOutput";
import { createWorkflow } from "../../core/utils/workflow-builder";

interface BlogWritingWorkflowInputs {
  title: string;
  prompt: string;
  setOutput?: (value: string) => void;
}

interface BlogWritingWorkflowOutputs {
  output: string;
}

export const BlogWritingWorkflow = createWorkflow<
  BlogWritingWorkflowInputs,
  BlogWritingWorkflowOutputs
>(({ title, prompt, setOutput }) => {
  // Research phase
  const [researchNotes, setResearchNotes] = createWorkflowOutput<string>("");
  const [sources, setSources] = createWorkflowOutput<string[]>([]);
  const [outline, setOutline] = createWorkflowOutput<string>("");

  // Writing phase
  const [draft, setDraft] = createWorkflowOutput<string>("");
  const [metadata, setMetadata] = createWorkflowOutput<{
    wordCount: number;
    readingTime: number;
    keywords: string[];
  }>({ wordCount: 0, readingTime: 0, keywords: [] });

  // Final edited output
  const [finalOutput, setFinalOutput] = createWorkflowOutput<string>("");

  // If setOutput is provided, forward the final output to it
  if (setOutput) {
    finalOutput.then(setOutput);
  }

  const element = (
    <>
      <LLMResearcher
        title={title}
        prompt={prompt}
        setResearch={setResearchNotes}
        setSources={setSources}
        setSummary={setOutline}
      />
      <LLMWriter
        content={researchNotes}
        setContent={setDraft}
        setMetadata={setMetadata}
      />
      <LLMEditor content={draft} setContent={setFinalOutput} />
    </>
  );

  return {
    element,
    outputs: {
      output: finalOutput,
    },
  };
});
