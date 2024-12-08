import React, { useContext } from "react";
import { Step } from "./Step";
import { ExecutionContext } from "./ExecutionContext";
import { StepContext } from "./StepContext";

interface LLMEditorProps {
  inputRef: string;
  outputRef: string;
}

export function LLMEditor({
  inputRef,
  outputRef,
}: LLMEditorProps): React.ReactElement | null {
  const stepContext = useContext(StepContext);

  if (!stepContext) {
    throw new Error("LLMEditor must be used within a Workflow.");
  }

  const step: Step = {
    async execute(context: ExecutionContext): Promise<void> {
      const input = context.getRef<string>(inputRef);
      if (input === undefined) {
        throw new Error(`LLMEditor: Input ref '${inputRef}' is undefined.`);
      }
      // Simulate LLM editing
      const result = `Edited content: ${input}`;
      context.setRef(outputRef, result);
      console.log(`LLMEditor: Set ref '${outputRef}'`);
    },
  };

  stepContext.steps.push(step);

  return null;
}
