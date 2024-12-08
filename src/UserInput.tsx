import React, { useContext } from "react";
import { Step } from "./Step";
import { ExecutionContext } from "./ExecutionContext";
import { StepContext } from "./StepContext";

interface UserInputProps {
  id: string;
  prompt: string;
}

export function UserInput({
  id,
  prompt,
}: UserInputProps): React.ReactElement | null {
  const stepContext = useContext(StepContext);

  if (!stepContext) {
    throw new Error("UserInput must be used within a Workflow.");
  }

  const step: Step = {
    async execute(context: ExecutionContext): Promise<void> {
      // Simulate user input
      const userInput = prompt;
      context.setRef(id, userInput);
      console.log(`UserInput: Set ref '${id}' to '${userInput}'`);
    },
  };

  stepContext.steps.push(step);

  return null;
}
