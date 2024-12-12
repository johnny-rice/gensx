import React from "react";
import { Step } from "../components/Step";
import { renderWorkflow } from "./renderWorkflow";
import { ExecutionContext } from "../context/ExecutionContext";
import { createWorkflowOutput } from "../hooks/useWorkflowOutput";

type WorkflowRenderFunction<T> = (value: T) => React.ReactElement | null;

type WorkflowImplementation<TProps, TOutput> = (
  props: ResolvedProps<TProps>,
  render: WorkflowRenderFunction<TOutput>
) =>
  | React.ReactElement
  | Promise<React.ReactElement>
  | null
  | Promise<React.ReactElement | null>;

type WorkflowComponentProps<TProps, TOutput> = TProps & {
  children?: (output: TOutput) => React.ReactNode;
  setOutput?: (value: TOutput) => void;
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

// Keep track of processed results to prevent infinite loops
const processedResults = new Set<string>();

export function createWorkflow<TProps extends Record<string, any>, TOutput>(
  implementation: WorkflowImplementation<TProps, TOutput>
): React.ComponentType<WorkflowComponentProps<PromiseProps<TProps>, TOutput>> {
  const WorkflowComponent = (
    props: WorkflowComponentProps<PromiseProps<TProps>, TOutput>
  ): React.ReactElement | null => {
    console.log("Creating workflow component with props:", props);
    const { children, setOutput, ...componentProps } = props;
    console.log("Creating workflow output");
    const [output, setWorkflowOutput] = createWorkflowOutput<TOutput>(
      null as any
    );

    const step: Step = {
      async execute(context) {
        try {
          console.log("Executing workflow step");
          // Resolve all props in parallel
          const resolvedProps = {} as ResolvedProps<TProps>;
          console.log("Resolving props:", componentProps);
          await Promise.all(
            Object.entries(componentProps).map(async ([key, value]) => {
              resolvedProps[key as keyof TProps] = await resolveValue(value);
              console.log(
                `Resolved prop ${key}:`,
                resolvedProps[key as keyof TProps]
              );
            })
          );

          // Create render function that sets output and returns element
          const render: WorkflowRenderFunction<TOutput> = (value) => {
            console.log("Render function called with value:", value);
            console.log("Setting workflow output");
            setWorkflowOutput(value);
            if (setOutput) {
              console.log("Calling setOutput with value:", value);
              setOutput(value);
            }
            if (children) {
              console.log("Calling children with value:", value);
              return children(value) as React.ReactElement;
            }
            console.log("No children, returning null");
            return null;
          };

          // Get the workflow result with resolved props
          console.log("Getting workflow result");
          const element = await Promise.resolve(
            implementation(resolvedProps, render)
          );
          console.log("Got workflow result:", element);

          // Process the element chain
          if (element) {
            console.log("Processing element chain");
            const elementSteps = renderWorkflow(element);
            console.log("Got element steps:", elementSteps);
            // Execute steps sequentially to ensure proper chaining
            for (const step of elementSteps) {
              await step.execute(context);
            }
            console.log("Finished executing element steps");
          }
        } catch (error) {
          console.error("Error in workflow step:", error);
          throw error;
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
    props: WorkflowComponentProps<PromiseProps<TProps>, TOutput>
  ): Promise<React.ReactElement | null> => {
    console.log("Getting workflow result with props:", props);
    const { children, setOutput, ...componentProps } = props;

    // Generate a unique key for this result
    const resultKey = JSON.stringify(componentProps);
    if (processedResults.has(resultKey)) {
      console.log("Result already processed, skipping:", resultKey);
      return null;
    }
    processedResults.add(resultKey);

    console.log("Creating workflow output");
    const [output, setWorkflowOutput] = createWorkflowOutput<TOutput>(
      null as any
    );

    try {
      // Resolve all props before passing to implementation
      const resolvedProps = {} as ResolvedProps<TProps>;
      console.log("Resolving props:", componentProps);
      for (const [key, value] of Object.entries(componentProps)) {
        resolvedProps[key as keyof TProps] = await resolveValue(value);
        console.log(
          `Resolved prop ${key}:`,
          resolvedProps[key as keyof TProps]
        );
      }

      // Create render function that sets output and returns element
      const render: WorkflowRenderFunction<TOutput> = (value) => {
        console.log("Render function called with value:", value);
        console.log("Setting workflow output");
        setWorkflowOutput(value);
        if (setOutput) {
          console.log("Calling setOutput with value:", value);
          setOutput(value);
        }
        if (children) {
          console.log("Calling children with value:", value);
          return children(value) as React.ReactElement;
        }
        console.log("No children, returning null");
        return null;
      };

      // Get the workflow result
      console.log("Getting implementation result");
      const implementationResult = await implementation(resolvedProps, render);
      console.log("Implementation returned:", implementationResult);

      return implementationResult;
    } catch (error) {
      console.error("Error in getWorkflowResult:", error);
      throw error;
    } finally {
      processedResults.delete(resultKey);
    }
  };

  WorkflowComponent.displayName = "Workflow";
  return WorkflowComponent;
}
