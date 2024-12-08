import React, { useContext } from "react";
import { Step } from "./Step";
import { ExecutionContext } from "./ExecutionContext";
import { StepContext } from "./StepContext";

interface LLMEditorProps<TRefs extends Record<string, any>> {
  inputRef: keyof TRefs;
  outputRef: keyof TRefs;
}

export function LLMEditor<TRefs extends Record<string, any>>({
  inputRef,
  outputRef,
}: LLMEditorProps<TRefs>): React.ReactElement | null {
  const stepContext = useContext(StepContext);

  if (!stepContext) {
    throw new Error("LLMEditor must be used within a Workflow.");
  }

  const step: Step<TRefs> = {
    async execute(context: ExecutionContext<TRefs>): Promise<void> {
      const input = context.getRef(inputRef);
      if (input === undefined) {
        throw new Error(
          `LLMEditor: Input ref '${String(inputRef)}' is undefined.`
        );
      }
      // Simulate LLM editing
      const result = `Edited content: ${input}` as TRefs[typeof outputRef];
      context.setRef(outputRef, result);
    },
  };

  stepContext.steps.push(step);
  return null;
}
