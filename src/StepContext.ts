import React from "react";
import { Step } from "./Step";

export interface StepContextValue<TRefs extends Record<string, any> = any> {
  steps: Step<TRefs>[];
}

export const StepContext = React.createContext<StepContextValue>({ steps: [] });
