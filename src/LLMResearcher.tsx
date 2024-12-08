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

interface ResearchProps<TRefs extends Record<string, any>> {
  title: string | RefType<string>;
  prompt: string | RefType<string>;
  outputs: OutputRefs<ResearchOutputs>;
}

export function LLMResearcher<TRefs extends Record<string, any>>(
  props: ResearchProps<TRefs>
): React.ReactElement | null {
  const stepContext = useContext(StepContext);

  if (!stepContext) {
    throw new Error("LLMResearcher must be used within a Workflow.");
  }

  const step: Step<TRefs> = {
    async execute(context: ExecutionContext<TRefs>): Promise<void> {
      const resolveInput = <T,>(input: T | RefType<T>): T => {
        if (isRef(input)) {
          const value = context.getRef(input.__ref as keyof TRefs);
          if (value === undefined) {
            throw new Error(`Input ref '${input.__ref}' is undefined`);
          }
          return value as T;
        }
        return input;
      };

      const title = resolveInput(props.title);
      const prompt = resolveInput(props.prompt);

      // Simulate research with multiple outputs
      const research =
        `Research based on title: ${title}, prompt: ${prompt}` as TRefs[typeof props.outputs.research];
      const sources = [
        "source1.com",
        "source2.com",
      ] as TRefs[typeof props.outputs.sources];
      const summary =
        "Brief summary of findings" as TRefs[typeof props.outputs.summary];

      // Set multiple outputs
      context.setRef(props.outputs.research as keyof TRefs, research);
      context.setRef(props.outputs.sources as keyof TRefs, sources);
      context.setRef(props.outputs.summary as keyof TRefs, summary);
    },
  };

  stepContext.steps.push(step);
  return null;
}
