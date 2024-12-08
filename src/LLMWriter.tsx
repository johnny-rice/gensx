import React, { useContext } from "react";
import { Step } from "./Step";
import { ExecutionContext } from "./ExecutionContext";
import { StepContext } from "./StepContext";
import { RefType, isRef } from "./ref";
import { OutputRefs } from "./outputs";

interface WriterOutputs {
  content: string;
  metadata: {
    wordCount: number;
    readingTime: number;
    keywords: string[];
  };
}

interface LLMWriterProps {
  inputRef: string;
  outputs: OutputRefs<WriterOutputs>;
}

export function LLMWriter({
  inputRef,
  outputs,
}: LLMWriterProps): React.ReactElement | null {
  const stepContext = useContext(StepContext);

  if (!stepContext) {
    throw new Error("LLMWriter must be used within a Workflow.");
  }

  const step: Step = {
    async execute(context: ExecutionContext): Promise<void> {
      const input = context.getRef<string>(inputRef);
      if (input === undefined) {
        throw new Error(`LLMWriter: Input ref '${inputRef}' is undefined.`);
      }

      // Simulate LLM writing with multiple outputs
      const content = `Written content based on: ${input}`;
      const metadata = {
        wordCount: content.split(" ").length,
        readingTime: Math.ceil(content.split(" ").length / 200),
        keywords: ["sample", "content", "test"],
      };

      context.setRef(outputs.content, content);
      context.setRef(outputs.metadata, metadata);

      console.log(`LLMWriter: Set content ref '${outputs.content}'`);
      console.log(`LLMWriter: Set metadata ref '${outputs.metadata}'`);
    },
  };

  stepContext.steps.push(step);
  return null;
}
