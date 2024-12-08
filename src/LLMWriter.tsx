import React, { useContext } from "react";
import { Step } from "./Step";
import { ExecutionContext } from "./ExecutionContext";
import { StepContext } from "./StepContext";
import { RefType } from "./ref";
import { OutputRefs } from "./outputs";

interface WriterOutputs {
  content: string;
  metadata: {
    wordCount: number;
    readingTime: number;
    keywords: string[];
  };
}

interface LLMWriterProps<TRefs extends Record<string, any>> {
  inputRef: keyof TRefs;
  outputs: OutputRefs<WriterOutputs>;
}

export function LLMWriter<TRefs extends Record<string, any>>({
  inputRef,
  outputs,
}: LLMWriterProps<TRefs>): React.ReactElement | null {
  const stepContext = useContext(StepContext);

  if (!stepContext) {
    throw new Error("LLMWriter must be used within a Workflow.");
  }

  const step: Step<TRefs> = {
    async execute(context: ExecutionContext<TRefs>): Promise<void> {
      const input = context.getRef(inputRef);
      if (input === undefined) {
        throw new Error(
          `LLMWriter: Input ref '${String(inputRef)}' is undefined.`
        );
      }

      // Simulate LLM writing with multiple outputs
      const content =
        `Written content based on: ${input}` as TRefs[typeof outputs.content];
      const metadata = {
        wordCount: content.split(" ").length,
        readingTime: Math.ceil(content.split(" ").length / 200),
        keywords: ["sample", "content", "test"],
      } as TRefs[typeof outputs.metadata];

      context.setRef(outputs.content as keyof TRefs, content);
      context.setRef(outputs.metadata as keyof TRefs, metadata);
    },
  };

  stepContext.steps.push(step);
  return null;
}
