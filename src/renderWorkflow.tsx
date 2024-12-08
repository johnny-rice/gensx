import React from "react";
import ReactDOMServer from "react-dom/server";
import { Step } from "./Step";
import { StepContext, StepContextValue } from "./StepContext";
import { ExecutionContext } from "./ExecutionContext";

export function renderWorkflow(element: React.ReactElement): Step[] {
  const steps: Step[] = [];

  const stepContextValue: StepContextValue = { steps };

  // Render the element tree to collect steps via the context
  const rendered = ReactDOMServer.renderToStaticMarkup(
    <StepContext.Provider value={stepContextValue}>
      {element.props.children}
    </StepContext.Provider>
  );

  console.log("Rendered:", rendered);

  return steps;
}

export async function execute(
  workflow: React.JSX.Element,
  context?: ExecutionContext
): Promise<void> {
  const steps = renderWorkflow(workflow);
  let workflowContext = context ?? new ExecutionContext();
  for (const step of steps) {
    await step.execute(workflowContext);
  }
  return;
}
