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

    // Execute steps in order
    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      const componentId = i.toString();

      // Execute the step
      await step.execute(new ExecutionContext());

      // Process execution queue if any dependencies were updated
      while (this.executionQueue.size > 0) {
        const queuedIds = Array.from(this.executionQueue);
        this.executionQueue.clear();

        for (const id of queuedIds) {
          if (parseInt(id) > i) continue; // Skip future steps
          await this.steps[parseInt(id)].execute(new ExecutionContext());
        }
      }
    }

    WorkflowContext.current = null;
  }
}
