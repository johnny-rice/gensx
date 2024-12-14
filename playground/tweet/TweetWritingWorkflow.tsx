import { createWorkflow } from "@/src/core/utils/workflow-builder";

import { LLMEditor } from "../shared/components/LLMEditor";
import { LLMWriter } from "../shared/components/LLMWriter";

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
        {editedContent => render(editedContent)}
      </LLMEditor>
    )}
  </LLMWriter>
));
