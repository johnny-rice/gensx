import { createWorkflow } from "@/src/core/utils/workflow-builder";

interface ResearcherProps {
  title: string;
  prompt: string;
}

interface ResearcherOutput {
  research: string;
  sources: string[];
  summary: string;
}

export const LLMResearcher = createWorkflow<ResearcherProps, ResearcherOutput>(
  // eslint-disable-next-line @typescript-eslint/require-await
  async (props, render) => {
    const result = {
      research: `Research based on title: ${props.title}, prompt: ${props.prompt}`,
      sources: ["source1.com", "source2.com"],
      summary: "Brief summary of findings",
    };
    return render(result);
  },
);
