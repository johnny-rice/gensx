import { ExecutionContext } from "../context/ExecutionContext";

export interface Step<TRefs extends Record<string, any>> {
  execute(context: ExecutionContext<TRefs>): Promise<void>;
}
