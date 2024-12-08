import { ExecutionContext } from "./ExecutionContext";

export interface Step {
  execute(context: ExecutionContext): Promise<void>;
}
