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
    // Use renderWorkflow utility to collect initial steps
    this.steps = renderWorkflow(workflow);
    console.log(`Collected ${this.steps.length} initial steps`);
  }

  notifyUpdate(componentId: string) {
    if (!this.executedSteps.has(componentId)) {
      console.log(`Queuing step ${componentId} for execution`);
      this.executionQueue.add(componentId);
    }
  }

  private async executeStep(step: Step, stepId: string): Promise<void> {
    if (this.executedSteps.has(stepId)) {
      console.log(`Step ${stepId} already executed, skipping`);
      return;
    }

    try {
      console.log(`Starting execution of step ${stepId}`);
      const context = new ExecutionContext();
      const childSteps = await step.execute(context);
      this.executedSteps.add(stepId);
      console.log(`Successfully completed step ${stepId}`);

      if (childSteps && childSteps.length > 0) {
        console.log(
          `Step ${stepId} generated ${childSteps.length} child steps`
        );
        // Store child steps with their parent's ID as prefix
        this.dynamicSteps.set(stepId, childSteps);

        // Execute all child steps in parallel
        const childPromises = childSteps.map((childStep, index) => {
          const childId = `${stepId}_${index}`;
          if (!this.executedSteps.has(childId)) {
            console.log(`Executing child step ${childId}`);
            return this.executeStep(childStep, childId);
          }
          console.log(`Child step ${childId} already executed, skipping`);
          return Promise.resolve();
        });

        await Promise.all(childPromises);
        console.log(`All child steps of ${stepId} completed`);
      } else {
        console.log(`Step ${stepId} did not generate any child steps`);
      }
    } catch (error) {
      console.error(`Error executing step ${stepId}:`, error);
      throw error; // Re-throw to propagate the error
    }
  }

  async execute() {
    WorkflowContext.current = this;

    try {
      console.log("Starting workflow execution...");
      // Execute all initial steps in parallel
      const initialStepPromises = this.steps.map((step, index) => {
        const stepId = index.toString();
        console.log(`Scheduling initial step ${stepId}`);
        return this.executeStep(step, stepId);
      });

      await Promise.all(initialStepPromises);
      console.log("All initial steps completed");

      // Process any remaining steps in the queue
      while (this.executionQueue.size > 0) {
        const queuedIds = Array.from(this.executionQueue);
        console.log(
          `Processing ${queuedIds.length} queued steps: ${queuedIds.join(", ")}`
        );
        this.executionQueue.clear();

        await Promise.all(
          queuedIds.map(async (id) => {
            try {
              const step = this.steps[parseInt(id)];
              if (step) {
                console.log(`Executing queued step ${id}`);
                return this.executeStep(step, id);
              } else {
                // Check dynamic steps
                for (const [parentId, steps] of this.dynamicSteps.entries()) {
                  const dynamicIndex = parseInt(id.split("_")[1]);
                  if (!isNaN(dynamicIndex) && steps[dynamicIndex]) {
                    console.log(
                      `Executing dynamic step ${id} from parent ${parentId}`
                    );
                    return this.executeStep(steps[dynamicIndex], id);
                  }
                }
                console.log(`No step found for id ${id}`);
              }
            } catch (error) {
              console.error(`Error executing queued step ${id}:`, error);
              throw error;
            }
          })
        );
      }
      console.log("Workflow execution completed successfully");
    } catch (error) {
      console.error("Error during workflow execution:", error);
      throw error; // Re-throw to ensure the error is propagated
    } finally {
      WorkflowContext.current = null;
    }
  }
}
