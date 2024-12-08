import { createComponent } from "./createComponent";

interface UserInputs {
  value: string;
}

interface UserOutputs {
  value: string;
}

export const UserInput = createComponent<UserInputs, UserOutputs, any>(
  async ({ value }) => {
    console.log(`UserInput: Setting value to '${value}'`);
    return {
      value: value,
    };
  }
);
