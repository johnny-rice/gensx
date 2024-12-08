import React from "react";
import { Step } from "./Step";

export function collectSteps(
  element: React.ReactNode
): Step<Record<string, any>>[] {
  const steps: Step<Record<string, any>>[] = [];

  function traverse(node: React.ReactNode): void {
    if (node == null) return;

    if (Array.isArray(node)) {
      node.forEach(traverse);
    } else if (React.isValidElement(node)) {
      const { type, props } = node;

      // Handle fragments
      if (type === React.Fragment) {
        traverse(props.children);
      }
      // Handle function components
      else if (typeof type === "function") {
        if (type.prototype?.isReactComponent) {
          // Class component
          const instance = new (type as React.ComponentClass)(props);
          const childElement = instance.render();
          traverse(childElement);
        } else {
          // Function component
          const childElement = (type as React.FunctionComponent)(props);
          traverse(childElement);
        }
      }
      // Handle class components (if any)
      else if (
        typeof type === "object" &&
        type !== null &&
        typeof (type as React.ComponentClass).prototype.render === "function"
      ) {
        // Class component
        const instance = new (type as React.ComponentClass)(props);
        const childElement = instance.render();
        traverse(childElement);
      }
      // Handle other elements
      else {
        // Do nothing for other types
      }
    } else if (
      typeof node === "object" &&
      "execute" in node &&
      typeof node.execute === "function"
    ) {
      // Node is a Step object
      steps.push(node as Step<Record<string, any>>);
    }
    // Ignore other types (strings, numbers)
  }

  traverse(element);
  return steps;
}
