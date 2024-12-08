import React from "react";
import { StepContext } from "../context/StepContext";
import { Step } from "./Step";
import { ExecutionContext } from "../context/ExecutionContext";
import { renderWorkflow } from "../utils/renderWorkflow";

type ExtractRefs<T> = T extends React.ReactElement<any, infer C>
  ? C extends { __refs: any }
    ? C["__refs"]
    : never
  : never;

type CombineChildRefs<T> = T extends React.ReactElement
  ? ExtractRefs<T>
  : T extends Array<infer U>
  ? ExtractRefs<U>
  : never;

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

export class WorkflowContext<T extends React.ReactElement> {
  private context: ExecutionContext<CombineChildRefs<T>> = new ExecutionContext<
    CombineChildRefs<T>
  >();

  constructor(private workflow: T) {}

  async execute(): Promise<void> {
    const steps = renderWorkflow(this.workflow);
    for (const step of steps) {
      await step.execute(this.context);
    }
  }

  getRef<K extends keyof CombineChildRefs<T>>(
    key: K
  ): CombineChildRefs<T>[K] | undefined {
    return this.context.getRef(key);
  }
}
