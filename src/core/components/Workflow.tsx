import React from "react";
import { ExecutionContext } from "../context/ExecutionContext";
import { Step } from "./Step";
import { StepContext } from "../context/StepContext";
import { renderWorkflow } from "../utils/renderWorkflow";

export function Workflow({ children }: { children: React.ReactNode }) {
  const steps: Step[] = [];
  return (
    <StepContext.Provider value={{ steps }}>{children}</StepContext.Provider>
  );
}

export class WorkflowContext {
  static current: WorkflowContext | null = null;
  private executionQueue: Set<string> = new Set();
  private steps: Step[] = [];
  private dynamicSteps: Map<string, Step[]> = new Map();
  private executedSteps: Set<string> = new Set();

  constructor(workflow: React.ReactElement) {
    this.steps = renderWorkflow(workflow);
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

    try {
      const context = new ExecutionContext();
      const childSteps = await step.execute(context);
      this.executedSteps.add(stepId);

      if (childSteps && childSteps.length > 0) {
        this.dynamicSteps.set(stepId, childSteps);

        const childPromises = childSteps.map((childStep, index) => {
          const childId = `${stepId}_${index}`;
          if (!this.executedSteps.has(childId)) {
            return this.executeStep(childStep, childId);
          }
          return Promise.resolve();
        });

        await Promise.all(childPromises);
      }
    } catch (error) {
      throw error;
    }
  }

  async execute() {
    WorkflowContext.current = this;

    try {
      const initialStepPromises = this.steps.map((step, index) => {
        const stepId = index.toString();
        return this.executeStep(step, stepId);
      });

      await Promise.all(initialStepPromises);

      while (this.executionQueue.size > 0) {
        const queuedIds = Array.from(this.executionQueue);
        this.executionQueue.clear();

        await Promise.all(
          queuedIds.map(async (id) => {
            try {
              const step = this.steps[parseInt(id)];
              if (step) {
                return this.executeStep(step, id);
              } else {
                for (const [parentId, steps] of this.dynamicSteps.entries()) {
                  const dynamicIndex = parseInt(id.split("_")[1]);
                  if (!isNaN(dynamicIndex) && steps[dynamicIndex]) {
                    return this.executeStep(steps[dynamicIndex], id);
                  }
                }
              }
            } catch (error) {
              throw error;
            }
          })
        );
      }
    } catch (error) {
      throw error;
    } finally {
      WorkflowContext.current = null;
    }
  }
}
