import React, { useEffect } from "react";
import { LLMResearcher } from "../shared/components/LLMResearcher";
import { LLMWriter } from "../shared/components/LLMWriter";
import { LLMEditor } from "../shared/components/LLMEditor";
import { useWorkflowOutput } from "../../core/hooks/useWorkflowOutput";
import { defineWorkflow } from "../../core/utils/workflow-builder";

interface BlogWritingWorkflowProps {
  title: string;
  prompt: string;
  setOutput: (content: string) => void;
}

export const BlogWritingWorkflow = defineWorkflow<BlogWritingWorkflowProps>(
  ({ title, prompt, setOutput }) => {
    // Research phase
    const [getResearchNotes, setResearchNotes] = useWorkflowOutput<string>("");
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
        {/* Research Phase */}
        <LLMResearcher
          title={title}
          prompt={prompt}
          setResearch={setResearchNotes}
          setSources={(sources) => {
            /* handle sources if needed */
          }}
          setSummary={setOutline}
        />

        {/* Writing Phase */}
        <LLMWriter
          content={getResearchNotes()}
          setContent={setDraft}
          setMetadata={setMetadata}
        />

        {/* Editing Phase */}
        <LLMEditor content={getDraft()} setContent={setOutput} />
      </>
    );
  }
);
