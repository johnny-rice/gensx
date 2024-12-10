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
    const [researchNotes, setResearchNotes] = useWorkflowOutput<string>("");
    const [sources, setSources] = useWorkflowOutput<string[]>([]);
    const [outline, setOutline] = useWorkflowOutput<string>("");

    // Writing phase
    const [draft, setDraft] = useWorkflowOutput<string>("");
    const [metadata, setMetadata] = useWorkflowOutput<{
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
          setSources={setSources}
          setSummary={setOutline}
        />

        {/* Writing Phase */}
        <LLMWriter
          content={researchNotes}
          setContent={setDraft}
          setMetadata={setMetadata}
        />

        {/* Editing Phase */}
        <LLMEditor content={draft} setContent={setOutput} />
      </>
    );
  }
);
