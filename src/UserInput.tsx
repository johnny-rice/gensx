import React, { useContext } from "react";
import { Step } from "./Step";
import { ExecutionContext } from "./ExecutionContext";
import { StepContext } from "./StepContext";

interface UserInputProps {
  id: string;
  value: string;
}

export function UserInput({
  id,
  value,
}: UserInputProps): React.ReactElement | null {
  const stepContext = useContext(StepContext);

  if (!stepContext) {
    throw new Error("UserInput must be used within a Workflow.");
  }

  const step: Step = {
    async execute(context: ExecutionContext): Promise<void> {
      context.setRef(id, value);
      console.log(`UserInput: Set ref '${id}' to '${value}'`);
    },
  };

  stepContext.steps.push(step);

  return null;
}
