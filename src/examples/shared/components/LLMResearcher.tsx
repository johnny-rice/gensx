import { createWorkflow } from "../../../core/utils/workflow-builder";

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
    console.log("LLMResearcher: Starting execution with props:", props);
    console.log("LLMResearcher: Generating research result");
    const result = {
      research: `Research based on title: ${props.title}, prompt: ${props.prompt}`,
      sources: ["source1.com", "source2.com"],
      summary: "Brief summary of findings",
    };
    console.log("LLMResearcher: Generated result:", result);
    console.log("LLMResearcher: Calling render function");
    const renderResult = render(result);
    console.log("LLMResearcher: Render function returned:", renderResult);
    return renderResult;
  }
);
