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

type WorkflowOutputPromises<TOutputs extends Record<string, any>> = {
  [K in keyof TOutputs]: Promise<TOutputs[K]>;
};

type WorkflowComponentProps<
  TProps extends Record<string, any>,
  TOutputs extends Record<string, any>
> = Omit<TProps, keyof WorkflowSharedProps<TOutputs>> &
  WorkflowSharedProps<TOutputs>;

type WorkflowSharedProps<TOutputs extends Record<string, any>> = {
  setOutput?: (value: HasOutput<TOutputs>) => void;
  children?: (outputs: WorkflowOutputPromises<TOutputs>) => React.ReactNode;
};

export function defineWorkflow<
  TProps extends Record<string, any>,
  TOutputs extends Record<string, any> = Record<string, never>
>(
  workflowFn: (props: TProps) => Omit<WorkflowResult<TOutputs>, "steps">
): React.ComponentType<WorkflowComponentProps<TProps, TOutputs>> {
  const WorkflowComponent = (
    props: WorkflowComponentProps<TProps, TOutputs>
  ): React.ReactElement | null => {
    const { children, setOutput, ...componentProps } = props;

    // Get the workflow result
    const result = workflowFn(componentProps as TProps);

    // If we have children and outputs, render them together
    if (children && result.outputs) {
      // Convert WorkflowOutputs to the format expected by children
      const outputPromises = Object.entries(result.outputs).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: value.value,
        }),
        {} as WorkflowOutputPromises<TOutputs>
      );

      const childElement = children(outputPromises);
      return React.createElement(
        React.Fragment,
        null,
        result.element,
        childElement
      );
    }

    return result.element;
  };

  // For execution phase, we need a way to get the workflow result without React
  WorkflowComponent.getWorkflowResult = (
    props: WorkflowComponentProps<TProps, TOutputs>
  ): Omit<WorkflowResult<TOutputs>, "steps"> => {
    const { children, ...componentProps } = props;
    const result = workflowFn(componentProps as TProps);

    // If we have children and outputs, include their element
    if (children && result.outputs) {
      // Convert WorkflowOutputs to the format expected by children
      const outputPromises = Object.entries(result.outputs).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: value.value,
        }),
        {} as WorkflowOutputPromises<TOutputs>
      );

      const childElement = children(outputPromises);
      return {
        ...result,
        element: React.createElement(
          React.Fragment,
          null,
          result.element,
          childElement
        ),
      };
    }

    return result;
  };

  WorkflowComponent.displayName = `${workflowFn.name}Workflow`;
  return WorkflowComponent;
}

async function resolveValue<T>(value: T | Promise<T>): Promise<T> {
  return await value;
}
