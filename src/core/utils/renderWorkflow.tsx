import React from "react";
import { Step } from "../components/Step";

type FunctionComponent = (props: any) => React.ReactElement | null;

// Keep track of workflows that have been processed to avoid double execution
const processedWorkflows = new Set<string>();

export function renderWorkflow(element: React.ReactElement): Step[] {
  console.log("renderWorkflow: Starting with element:", {
    type: element.type,
    props: element.props,
  });
  processedWorkflows.clear();
  const steps: Step[] = [];

  function processElement(el: React.ReactNode): void {
    console.log("processElement: Processing node:", el);
    if (!React.isValidElement(el)) {
      console.log("processElement: Not a valid element, skipping");
      return;
    }

    // If it's a function component, execute it and process its result
    const type = el.type as any;
    console.log("processElement: Element type:", {
      name: type.name,
      displayName: type.displayName,
      hasGetWorkflowResult: !!type.getWorkflowResult,
    });

    if (typeof type === "function" && !type.prototype?.render) {
      // For workflow components, use getWorkflowResult
      if (type.getWorkflowResult) {
        // Generate a unique key for this workflow instance
        const workflowKey = `${type.name}_${
          type.displayName || ""
        }_${Object.entries(el.props)
          .map(
            ([key, value]) =>
              `${key}:${value instanceof Promise ? "Promise" : value}`
          )
          .join("_")}`;

        console.log("processElement: Generated workflow key:", workflowKey);

        if (!processedWorkflows.has(workflowKey)) {
          console.log("processElement: Processing new workflow:", workflowKey);
          processedWorkflows.add(workflowKey);

          // Create a step for this workflow component
          const step: Step = {
            async execute(context) {
              console.log(
                "step.execute: Starting execution for workflow:",
                workflowKey
              );
              const resolvedProps = {} as any;
              // Resolve any promise props
              for (const [key, value] of Object.entries(el.props)) {
                console.log(`step.execute: Resolving prop ${key}`);
                resolvedProps[key] =
                  value instanceof Promise ? await value : value;
                console.log(
                  `step.execute: Resolved prop ${key}:`,
                  resolvedProps[key]
                );
              }
              // Execute the workflow with resolved props
              console.log("step.execute: Getting workflow result");
              const result = await type.getWorkflowResult(resolvedProps);
              console.log("step.execute: Got workflow result:", result);

              // Process any nested elements and collect their steps
              if (result) {
                console.log("step.execute: Processing nested result");
                const nestedSteps = renderWorkflow(result);
                console.log(
                  "step.execute: Got nested steps:",
                  nestedSteps.length
                );
                // Execute nested steps sequentially
                for (const nestedStep of nestedSteps) {
                  console.log("step.execute: Executing nested step");
                  await nestedStep.execute(context);
                }
              }
            },
          };

          console.log("processElement: Adding step for workflow:", workflowKey);
          steps.push(step);
        } else {
          console.log(
            "processElement: Workflow already processed:",
            workflowKey
          );
        }
      } else {
        // For regular components, execute them directly
        console.log("processElement: Executing regular component");
        const Component = type as FunctionComponent;
        const result = Component(el.props);
        console.log("processElement: Component result:", result);
        if (result) {
          processElement(result);
        }
      }
      return;
    }

    // Check if this is a WorkflowStep
    if (el.props["data-workflow-step"]) {
      console.log("processElement: Found workflow step");
      steps.push(el.props.step);
      return;
    }

    // Process children
    if (el.props?.children) {
      console.log("processElement: Processing children");
      if (Array.isArray(el.props.children)) {
        el.props.children.forEach((child: React.ReactNode, index: number) => {
          console.log(`processElement: Processing child ${index}`);
          processElement(child);
        });
      } else {
        processElement(el.props.children);
      }
    }
  }

  processElement(element);
  console.log("renderWorkflow: Finished, returning steps:", steps.length);
  return steps;
}
