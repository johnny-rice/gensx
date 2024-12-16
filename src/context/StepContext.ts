import React from "react";

import { Step } from "../components/Step";

export interface StepContextValue {
  steps: Step[];
}

export const StepContext = React.createContext<StepContextValue>({ steps: [] });
