import React from "react";
import ReactDOMServer from "react-dom/server";
import { Step } from "../components/Step";
import { StepContext, StepContextValue } from "../context/StepContext";
import { ExecutionContext } from "../context/ExecutionContext";

export function renderWorkflow(element: React.ReactElement): Step[] {
  const steps: Step[] = [];

  const stepContextValue: StepContextValue = { steps };

  // Render the element tree to collect steps via the context
  ReactDOMServer.renderToStaticMarkup(
    <StepContext.Provider value={stepContextValue}>
      {element.props.children}
    </StepContext.Provider>
  );

  return steps;
}
