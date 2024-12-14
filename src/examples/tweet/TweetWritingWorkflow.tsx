import React from "react";
import { LLMWriter } from "../shared/components/LLMWriter";
import { LLMEditor } from "../shared/components/LLMEditor";
import { createWorkflow } from "../../core/utils/workflow-builder";

interface TweetWritingWorkflowInputs {
  content: string | Promise<string>;
}

export const TweetWritingWorkflow = createWorkflow<
  TweetWritingWorkflowInputs,
  string
>((props, render) => (
  <LLMWriter content={props.content}>
    {({ content }) => (
      <LLMEditor content={content}>
        {(editedContent) => render(editedContent)}
      </LLMEditor>
    )}
  </LLMWriter>
));
