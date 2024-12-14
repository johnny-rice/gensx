import { ExecutionContext } from "../context/ExecutionContext";

export interface Step {
  execute(context: ExecutionContext): Promise<Step[]>;
}
