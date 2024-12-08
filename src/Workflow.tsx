import React from "react";
import { StepContext } from "./StepContext";
import { Step } from "./Step";
import { ExecutionContext } from "./ExecutionContext";
import { renderWorkflow } from "./renderWorkflow";

interface WorkflowProps {
  children: React.ReactNode;
}

export function Workflow({ children }: WorkflowProps): React.ReactElement {
  const steps: Step<Record<string, any>>[] = [];
  const stepContextValue = { steps };

  return (
    <StepContext.Provider value={stepContextValue}>
      {children}
    </StepContext.Provider>
  );
}

export class WorkflowContext<TRefs extends Record<string, any>> {
  private context: ExecutionContext<TRefs> = new ExecutionContext<TRefs>();

  constructor(private workflow: React.JSX.Element) {}

  async execute(): Promise<void> {
    const steps = renderWorkflow(this.workflow);
    for (const step of steps) {
      await step.execute(this.context);
    }
  }

  getRef<K extends keyof TRefs>(key: K): TRefs[K] | undefined {
    return this.context.getRef(key);
  }
}
