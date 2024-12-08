import React from "react";
import { StepContext } from "./StepContext";
import { Step } from "./Step";
import { ExecutionContext } from "./ExecutionContext";
import { renderWorkflow } from "./renderWorkflow";

interface WorkflowProps {
  children: React.ReactNode;
}

export function Workflow({ children }: WorkflowProps): React.ReactElement {
  const steps: Step[] = [];
  const stepContextValue = { steps };

  return (
    <StepContext.Provider value={stepContextValue}>
      {children}
    </StepContext.Provider>
  );
}

export class WorkflowContext {
  private context: ExecutionContext = new ExecutionContext();
  constructor(private workflow: React.JSX.Element) {}

  async execute(): Promise<void> {
    const steps = renderWorkflow(this.workflow);
    for (const step of steps) {
      await step.execute(this.context);
    }
    return;
  }

  getRef<T>(key: string): T | undefined {
    return this.context.getRef<T>(key);
  }
}
