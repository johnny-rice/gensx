import React from "react";
import { ExecutionContext } from "../context/ExecutionContext";
import { Step } from "./Step";
import { renderWorkflow } from "../utils/renderWorkflow";

export function Workflow({ children }: { children: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children);
}

export class WorkflowContext {
  static current: WorkflowContext | null = null;
  private executionQueue: Set<string> = new Set();
  private steps: Step[] = [];
  private dynamicSteps: Map<string, Step[]> = new Map();
  private executedSteps: Set<string> = new Set();

  constructor(workflow: React.ReactElement) {
    const wrappedWorkflow = React.createElement(React.Fragment, null, workflow);
    this.steps = renderWorkflow(wrappedWorkflow);
  }

  notifyUpdate(componentId: string) {
    if (!this.executedSteps.has(componentId)) {
      this.executionQueue.add(componentId);
    }
  }

  private async executeStep(step: Step, stepId: string): Promise<void> {
    if (this.executedSteps.has(stepId)) {
      return;
    }

    const context = new ExecutionContext();
    const childSteps = await step.execute(context);
    this.executedSteps.add(stepId);

    if (childSteps && childSteps.length > 0) {
      this.dynamicSteps.set(stepId, childSteps);

      // Execute all child steps in parallel
      await Promise.all(
        childSteps.map((childStep, index) => {
          const childId = `${stepId}_${index}`;
          if (!this.executedSteps.has(childId)) {
            return this.executeStep(childStep, childId);
          }
          return Promise.resolve();
        })
      );
    }
  }

  async execute() {
    WorkflowContext.current = this;

    try {
      // Execute all initial steps in parallel
      await Promise.all(
        this.steps.map((step, index) =>
          this.executeStep(step, index.toString())
        )
      );

      // Process any remaining steps in parallel
      while (this.executionQueue.size > 0) {
        const queuedIds = Array.from(this.executionQueue);
        this.executionQueue.clear();

        await Promise.all(
          queuedIds.map(async (id) => {
            const step = this.steps[parseInt(id)];
            if (step) {
              return this.executeStep(step, id);
            }

            // Check dynamic steps
            for (const [parentId, steps] of this.dynamicSteps.entries()) {
              const dynamicIndex = parseInt(id.split("_")[1]);
              if (!isNaN(dynamicIndex) && steps[dynamicIndex]) {
                return this.executeStep(steps[dynamicIndex], id);
              }
            }
          })
        );
      }
    } finally {
      WorkflowContext.current = null;
    }
  }
}
