import React from "react";
import ReactDOM from "react-dom/server";
import { ExecutionContext } from "../context/ExecutionContext";
import { Step } from "./Step";
import { StepContext } from "../context/StepContext";
import { renderWorkflow } from "../utils/renderWorkflow";

export function Workflow({ children }: { children: React.ReactNode }) {
  const steps: Step<any>[] = [];
  return (
    <StepContext.Provider value={{ steps }}>{children}</StepContext.Provider>
  );
}

export class WorkflowContext {
  static current: WorkflowContext | null = null;
  private executionQueue: Set<string> = new Set();
  private steps: Step<any>[] = [];

  constructor(workflow: React.ReactElement) {
    // Use renderWorkflow utility to collect steps
    this.steps = renderWorkflow(workflow);
    console.log("Collected steps:", this.steps.length);
  }

  notifyUpdate(componentId: string) {
    this.executionQueue.add(componentId);
  }

  async execute() {
    WorkflowContext.current = this;

    try {
      // Execute all steps in parallel
      await Promise.all(
        this.steps.map((step, index) => {
          const componentId = index.toString();
          return step.execute(new ExecutionContext());
        })
      );

      // Process any remaining updates in the queue
      while (this.executionQueue.size > 0) {
        const queuedIds = Array.from(this.executionQueue);
        this.executionQueue.clear();

        await Promise.all(
          queuedIds.map((id) =>
            this.steps[parseInt(id)].execute(new ExecutionContext())
          )
        );
      }
    } finally {
      WorkflowContext.current = null;
    }
  }
}
