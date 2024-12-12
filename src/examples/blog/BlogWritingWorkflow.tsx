import React from "react";
import { LLMResearcher } from "../shared/components/LLMResearcher";
import { LLMWriter } from "../shared/components/LLMWriter";
import { LLMEditor } from "../shared/components/LLMEditor";
import { createWorkflowOutput } from "../../core/hooks/useWorkflowOutput";
import { defineWorkflow } from "../../core/utils/workflow-builder";

interface BlogWritingWorkflowInputs {
  title: string;
  prompt: string;
  setOutput?: (value: string) => void;
}

interface BlogWritingWorkflowOutputs {
  output: string;
}

export const BlogWritingWorkflow = defineWorkflow<
  BlogWritingWorkflowInputs,
  BlogWritingWorkflowOutputs
>(({ title, prompt, setOutput }) => {
  console.log("BlogWritingWorkflow: Starting with title:", title);

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

  // Create our own output if one wasn't provided
  const [internalOutput, setInternalOutput] = setOutput
    ? [undefined, setOutput] // Use the provided setOutput
    : createWorkflowOutput<string>(""); // Create our own if not provided

  console.log("BlogWritingWorkflow: Created all outputs");

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
      <LLMEditor content={draft} setContent={setOutput || setInternalOutput} />
    </>
  );

  console.log("BlogWritingWorkflow: Created element with steps");

  return {
    element,
    outputs: {
      output: {
        value: internalOutput || draft, // If we're using external output, use draft as the value -- TODO this isn't right.
        setValue: setOutput || setInternalOutput,
      },
    },
  };
});
