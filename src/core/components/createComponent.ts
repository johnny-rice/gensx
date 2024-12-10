import React, { useContext } from "react";
import { Step } from "./Step";
import { ExecutionContext } from "../context/ExecutionContext";
import { StepContext } from "../context/StepContext";

type ComponentExecutor<TInputs> = (inputs: TInputs) => Promise<void>;

export function createComponent<TInputs extends Record<string, any>>(
  executor: ComponentExecutor<TInputs>
) {
  return function (props: TInputs): React.ReactElement | null {
    const stepContext = useContext(StepContext);
    if (!stepContext) {
      throw new Error("Component must be used within a Workflow.");
    }

    console.log("Adding step to context");
    const step: Step<Record<string, any>> = {
      async execute(
        context: ExecutionContext<Record<string, any>>
      ): Promise<void> {
        console.log("Executing step");
        await executor(props);
      },
    };

    stepContext.steps.push(step);
    return null;
  };
}
