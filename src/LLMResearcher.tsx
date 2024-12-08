import React, { useContext } from "react";
import { Step } from "./Step";
import { ExecutionContext } from "./ExecutionContext";
import { StepContext } from "./StepContext";

interface LLMResearcherProps {
  inputRef: string;
  outputRef: string;
}

export function LLMResearcher({
  inputRef,
  outputRef,
}: LLMResearcherProps): React.ReactElement | null {
  const stepContext = useContext(StepContext);

  if (!stepContext) {
    throw new Error("LLMResearcher must be used within a Workflow.");
  }

  const step: Step = {
    async execute(context: ExecutionContext): Promise<void> {
      const input = context.getRef<string>(inputRef);
      if (input === undefined) {
        throw new Error(`LLMResearcher: Input ref '${inputRef}' is undefined.`);
      }
      // Simulate LLM research
      const result = `Research based on: ${input}`;
      context.setRef(outputRef, result);
      console.log(`LLMResearcher: Set ref '${outputRef}'`);
    },
  };

  stepContext.steps.push(step);

  return null;
}
