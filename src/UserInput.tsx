import { createComponent } from "./createComponent";

interface UserInputs {
  value: string;
  prompt?: string;
}

interface UserOutputs {
  value: string;
}

export const UserInput = createComponent<UserInputs, UserOutputs, any>(
  async ({ value, prompt }) => {
    console.log(
      `UserInput: ${prompt ? `[${prompt}] ` : ""}Setting value to '${value}'`
    );
    return {
      value: value,
    };
  }
);
