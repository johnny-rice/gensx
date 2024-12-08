import { createComponent } from "./createComponent";

interface ResearchInputs {
  title: string;
  prompt: string;
}

interface ResearchOutputs {
  research: string;
  sources: string[];
  summary: string;
}

export const LLMResearcher = createComponent<
  ResearchInputs,
  ResearchOutputs,
  any
>(async ({ title, prompt }) => {
  return {
    research: `Research based on title: ${title}, prompt: ${prompt}`,
    sources: ["source1.com", "source2.com"],
    summary: "Brief summary of findings",
  };
});
