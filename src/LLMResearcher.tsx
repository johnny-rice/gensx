import React, { useContext } from "react";
import { Step } from "./Step";
import { ExecutionContext } from "./ExecutionContext";
import { StepContext } from "./StepContext";
import { RefType } from "./ref";
import { isRef } from "./ref";
import { OutputRefs } from "./outputs";

interface ResearchOutputs {
  research: string;
  sources: string[];
  summary: string;
}

interface ResearchProps {
  title: string | RefType<string>;
  prompt: string | RefType<string>;
  outputs: OutputRefs<ResearchOutputs>;
}

export function LLMResearcher(props: ResearchProps): React.ReactElement | null {
  const stepContext = useContext(StepContext);

  if (!stepContext) {
    throw new Error("LLMResearcher must be used within a Workflow.");
  }

  const step: Step = {
    async execute(context: ExecutionContext): Promise<void> {
      const resolveInput = <T,>(input: T | RefType<T>): T => {
        if (isRef(input)) {
          const value = context.getRef<T>(input.__ref);
          if (value === undefined) {
            throw new Error(`Input ref '${input.__ref}' is undefined`);
          }
          return value;
        }
        return input;
      };

      const title = resolveInput(props.title);
      const prompt = resolveInput(props.prompt);

      // Simulate research with multiple outputs
      const research = `Research based on title: ${title}, prompt: ${prompt}`;
      const sources = ["source1.com", "source2.com"];
      const summary = "Brief summary of findings";

      // Set multiple outputs
      context.setRef(props.outputs.research, research);
      context.setRef(props.outputs.sources, sources);
      context.setRef(props.outputs.summary, summary);
    },
  };

  stepContext.steps.push(step);
  return null;
}
