import { createComponent } from "../../../core/components/createComponent";

interface ResearcherProps {
  title: string;
  prompt: string;
  setResearch: (value: string) => void;
  setSources: (value: string[]) => void;
  setSummary: (value: string) => void;
}

export const LLMResearcher = createComponent<ResearcherProps>(
  async ({ title, prompt, setResearch, setSources, setSummary }) => {
    console.log("component: LLMResearcher running");
    const result = {
      research: `Research based on title: ${title}, prompt: ${prompt}`,
      sources: ["source1.com", "source2.com"],
      summary: "Brief summary of findings",
    };

    setResearch(result.research);
    setSources(result.sources);
    setSummary(result.summary);
  }
);
