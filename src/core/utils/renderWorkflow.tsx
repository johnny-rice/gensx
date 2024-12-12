import React from "react";
import { Step } from "../components/Step";

type FunctionComponent = (props: any) => React.ReactElement | null;

// Keep track of workflows that have been processed to avoid double execution
const processedWorkflows = new Set<string>();

export function renderWorkflow(element: React.ReactElement): Step[] {
  console.log(
    "Rendering workflow:",
    typeof element.type === "function" ? element.type.name : element.type
  );

  // Clear the processed workflows set at the start of each render
  processedWorkflows.clear();
  const steps: Step[] = [];

  function processElement(el: React.ReactNode): void {
    if (!React.isValidElement(el)) return;

    // Check if this is a WorkflowStep
    if (el.props["data-workflow-step"]) {
      steps.push(el.props.step);
      return;
    }

    // Process children
    if (el.props?.children) {
      if (Array.isArray(el.props.children)) {
        el.props.children.forEach(processElement);
      } else {
        processElement(el.props.children);
      }
    }

    // If it's a function component, execute it and process its result
    const type = el.type as any;
    if (typeof type === "function" && !type.prototype?.render) {
      // For workflow components, use getWorkflowResult
      if (type.getWorkflowResult) {
        // Generate a unique key for this workflow instance
        const workflowKey = `${type.name}_${JSON.stringify(el.props)}`;
        if (!processedWorkflows.has(workflowKey)) {
          processedWorkflows.add(workflowKey);
          const result = type.getWorkflowResult(el.props);
          if (result?.element) {
            processElement(result.element);
          }
        }
      } else {
        // For regular components, execute them directly
        const Component = type as FunctionComponent;
        const result = Component(el.props);
        if (result) {
          processElement(result);
        }
      }
    }
  }

  processElement(element);
  return steps;
}
