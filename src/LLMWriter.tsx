import React, { useContext } from "react";
import { Step } from "./Step";
import { ExecutionContext } from "./ExecutionContext";
import { StepContext } from "./StepContext";

interface LLMWriterProps {
  inputRef: string;
  outputRef: string;
}

export function LLMWriter({
  inputRef,
  outputRef,
}: LLMWriterProps): React.ReactElement | null {
  const stepContext = useContext(StepContext);

  if (!stepContext) {
    throw new Error("LLMWriter must be used within a Workflow.");
  }

  const step: Step = {
    async execute(context: ExecutionContext): Promise<void> {
      const input = context.getRef<string>(inputRef);
      if (input === undefined) {
        throw new Error(`LLMWriter: Input ref '${inputRef}' is undefined.`);
      }
      // Simulate LLM writing
      const result = `Written content based on: ${input}`;
      context.setRef(outputRef, result);
      console.log(`LLMWriter: Set ref '${outputRef}'`);
    },
  };

  stepContext.steps.push(step);

  return null;
}
