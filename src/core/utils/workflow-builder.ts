import React from "react";
import { Step } from "../components/Step";
import { renderWorkflow } from "./renderWorkflow";
import { ExecutionContext } from "../context/ExecutionContext";

interface WorkflowResult<TOutputs extends Record<string, any>> {
  element: React.ReactElement | null;
  outputs?: {
    [K in keyof TOutputs]: Promise<TOutputs[K]>;
  };
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

// Type to convert a props type to allow promises
type PromiseProps<TProps> = {
  [K in keyof TProps]: TProps[K] | Promise<TProps[K]>;
};

// Type to ensure implementation gets resolved props
type ResolvedProps<TProps> = {
  [K in keyof TProps]: TProps[K] extends Promise<infer U> ? U : TProps[K];
};

async function resolveValue<T>(value: T | Promise<T>): Promise<T> {
  return value instanceof Promise ? await value : value;
}

export function createWorkflow<
  TProps extends Record<string, any>,
  TOutputs extends Record<string, any> = Record<string, never>
>(
  implementation: (
    props: ResolvedProps<TProps>
  ) => Omit<WorkflowResult<TOutputs>, "steps">
): React.ComponentType<WorkflowComponentProps<PromiseProps<TProps>, TOutputs>> {
  const WorkflowComponent = (
    props: WorkflowComponentProps<PromiseProps<TProps>, TOutputs>
  ): React.ReactElement | null => {
    const { children, setOutput, ...componentProps } = props;

    const step: Step = {
      async execute(context) {
        // Resolve all props in parallel
        const resolvedProps = {} as ResolvedProps<TProps>;
        await Promise.all(
          Object.entries(componentProps).map(async ([key, value]) => {
            resolvedProps[key as keyof TProps] = await resolveValue(value);
          })
        );

        // Get the workflow result with resolved props
        const result = implementation(resolvedProps);

        // Process the element chain first
        if (result.element) {
          const elementSteps = renderWorkflow(result.element);
          await Promise.all(elementSteps.map((step) => step.execute(context)));
        }

        // If we have a setOutput prop, forward the output
        if (setOutput && result.outputs?.output) {
          const outputValue = await result.outputs.output;
          setOutput(outputValue);
        }

        // If we have children and outputs, process them after element chain
        if (children && result.outputs) {
          const childElement = children(result.outputs);
          if (childElement) {
            const childSteps = renderWorkflow(
              childElement as React.ReactElement
            );
            await Promise.all(childSteps.map((step) => step.execute(context)));
          }
        }
      },
    };

    return React.createElement("div", {
      "data-workflow-step": true,
      step,
    });
  };

  // For execution phase, we need a way to get the workflow result without React
  WorkflowComponent.getWorkflowResult = async (
    props: WorkflowComponentProps<PromiseProps<TProps>, TOutputs>
  ): Promise<Omit<WorkflowResult<TOutputs>, "steps">> => {
    const { children, setOutput, ...componentProps } = props;

    // Resolve all props before passing to implementation
    const resolvedProps = {} as ResolvedProps<TProps>;
    for (const [key, value] of Object.entries(componentProps)) {
      resolvedProps[key as keyof TProps] = await resolveValue(value);
    }

    const result = implementation(resolvedProps);

    // If we have a setOutput prop, forward the output
    if (setOutput && result.outputs?.output) {
      result.outputs.output.then(setOutput);
    }

    // Process the element chain first to ensure proper execution order
    let element = result.element;

    // Then process children if they exist
    if (children && result.outputs) {
      const outputPromises = result.outputs;
      const childElement = children(outputPromises);
      if (childElement) {
        element = React.createElement(
          React.Fragment,
          null,
          element,
          childElement
        );
      }
    }

    return {
      element,
      outputs: result.outputs,
    };
  };

  WorkflowComponent.displayName = "Workflow";
  return WorkflowComponent;
}
