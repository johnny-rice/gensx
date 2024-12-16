import { createWorkflow } from "@/src/utils/workflowBuilder";

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
  async (props, render) => {
    const result = {
      research: await Promise.resolve(
        `Research based on title: ${props.title}, prompt: ${props.prompt}`,
      ),
      sources: ["source1.com", "source2.com"],
      summary: "Brief summary of findings",
    };
    return render(result);
  },
);
