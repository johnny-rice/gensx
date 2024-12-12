import React from "react";
import { Step } from "../components/Step";

interface WorkflowOutput<T> {
  value: Promise<T>;
  setValue: (value: T) => void;
}

export interface WorkflowResult<TOutputs extends Record<string, any>> {
  element: React.ReactElement | null;
  outputs?: {
    [K in keyof TOutputs]: WorkflowOutput<TOutputs[K]>;
  };
  steps: Step[];
}

type HasOutput<T> = T extends { output: any } ? T["output"] : never;

export function defineWorkflow<
  TProps extends Record<string, any>,
  TOutputs extends Record<string, any> = Record<string, never>
>(workflowFn: (props: TProps) => Omit<WorkflowResult<TOutputs>, "steps">) {
  function WorkflowComponent(
    props: TProps & {
      setOutput?: (value: HasOutput<TOutputs>) => void;
      children?: (outputs: TOutputs) => React.ReactNode;
    }
  ): React.ReactElement | null {
    const { children, setOutput, ...componentProps } = props;

    // Get the workflow result
    const result = workflowFn(componentProps as TProps);

    // Return the element directly - renderWorkflow will handle step collection
    return result.element;
  }

  // For execution phase, we need a way to get the workflow result without React
  WorkflowComponent.getWorkflowResult = (props: TProps) => {
    return workflowFn(props);
  };

  WorkflowComponent.displayName = workflowFn.name + "Workflow";
  return WorkflowComponent;
}

async function resolveValue<T>(value: T | Promise<T>): Promise<T> {
  return await value;
}
