import React, { useContext } from "react";
import { Step } from "./Step";
import { ExecutionContext } from "./ExecutionContext";
import { StepContext } from "./StepContext";

interface UserInputProps<TRefs extends Record<string, any>> {
  id: keyof TRefs;
  value: string;
  prompt?: string;
}

export function UserInput<TRefs extends Record<string, any>>({
  id,
  value,
}: UserInputProps<TRefs>): React.ReactElement | null {
  const stepContext = useContext(StepContext);

  if (!stepContext) {
    throw new Error("UserInput must be used within a Workflow.");
  }

  const step: Step<TRefs> = {
    async execute(context: ExecutionContext<TRefs>): Promise<void> {
      context.setRef(id, value as TRefs[typeof id]);
      console.log(`UserInput: Set ref '${String(id)}' to '${value}'`);
    },
  };

  stepContext.steps.push(step);
  return null;
}
