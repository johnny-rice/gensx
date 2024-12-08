import { createComponent } from "./createComponent";

interface ContextInputs {
  value: string;
}

interface ContextOutputs {
  value: string;
}

// Helper to set a context value in a workflow.
// helpful way to pass props from an outer workflow into a subworkflow.

// Example:
// <UserInput
// value={props.title}
// outputs={Outputs<typeof refs>({
//   value: "blogPostTitle",
// })}
// />
// <UserInput
// value={props.prompt}
// outputs={Outputs<typeof refs>({
//   value: "blogPostPrompt",
// })}
// />
export const ContextInput = createComponent<ContextInputs, ContextOutputs, any>(
  async ({ value }) => {
    console.log(`UserInput: Setting value to '${value}'`);
    return {
      value: value,
    };
  }
);
