import React from "react";
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
    // Research outputs
    const [getResearchResult, setResearchResult] = useWorkflowOutput("");
    const [getSources, setSources] = useWorkflowOutput<string[]>([]);
    const [getSummary, setSummary] = useWorkflowOutput("");

    // Writer outputs
    const [getBlogPost, setBlogPost] = useWorkflowOutput("");
    const [getMetadata, setMetadata] = useWorkflowOutput<{
      wordCount: number;
      readingTime: number;
      keywords: string[];
    }>({
      wordCount: 0,
      readingTime: 0,
      keywords: [],
    });

    return (
      <>
        <LLMResearcher
          title={title}
          prompt={prompt}
          setResearch={setResearchResult}
          setSources={setSources}
          setSummary={setSummary}
        />
        <LLMWriter
          content={getResearchResult()}
          setContent={setBlogPost}
          setMetadata={setMetadata}
        />
        <LLMEditor content={getBlogPost()} setContent={setOutput} />
      </>
    );
  }
);
