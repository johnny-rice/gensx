import { createWorkflow } from "../../../core/utils/workflow-builder";
import { createWorkflowOutput } from "../../../core/hooks/useWorkflowOutput";

interface ResearcherProps {
  title: string;
  prompt: string;
  setResearch: (value: string) => void;
  setSources: (value: string[]) => void;
  setSummary: (value: string) => void;
}

interface ResearcherOutputs {
  research: string;
  sources: string[];
  summary: string;
}

export const LLMResearcher = createWorkflow<ResearcherProps, ResearcherOutputs>(
  (props) => {
    const [research, setResearch] = createWorkflowOutput<string>("");
    const [sources, setSources] = createWorkflowOutput<string[]>([]);
    const [summary, setSummary] = createWorkflowOutput<string>("");

    const result = {
      research: `Research based on title: ${props.title}, prompt: ${props.prompt}`,
      sources: ["source1.com", "source2.com"],
      summary: "Brief summary of findings",
    };

    setResearch(result.research);
    setSources(result.sources);
    setSummary(result.summary);

    // Forward outputs to parent if setters were provided
    if (props.setResearch) {
      research.then(props.setResearch);
    }
    if (props.setSources) {
      sources.then(props.setSources);
    }
    if (props.setSummary) {
      summary.then(props.setSummary);
    }

    return {
      element: null,
      outputs: {
        research: research,
        sources: sources,
        summary: summary,
      },
    };
  }
);
