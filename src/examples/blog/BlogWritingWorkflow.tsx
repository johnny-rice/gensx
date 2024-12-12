import React from "react";
import { LLMResearcher } from "../shared/components/LLMResearcher";
import { LLMWriter } from "../shared/components/LLMWriter";
import { LLMEditor } from "../shared/components/LLMEditor";
import { createWorkflow } from "../../core/utils/workflow-builder";

interface BlogWritingWorkflowInputs {
  title: string;
  prompt: string;
}

export const BlogWritingWorkflow = createWorkflow<
  BlogWritingWorkflowInputs,
  string
>((props, render) => {
  console.log("BlogWritingWorkflow: Starting with props:", props);
  const result = (
    <LLMResearcher title={props.title} prompt={props.prompt}>
      {({ research }) => {
        console.log("BlogWritingWorkflow: Got research result:", research);
        return (
          <LLMWriter content={research}>
            {({ content }) => {
              console.log("BlogWritingWorkflow: Got writer content:", content);
              return (
                <LLMEditor content={content}>
                  {(editedContent) => {
                    console.log(
                      "BlogWritingWorkflow: Got edited content:",
                      editedContent
                    );
                    console.log(
                      "BlogWritingWorkflow: Calling render with edited content"
                    );
                    return render(editedContent);
                  }}
                </LLMEditor>
              );
            }}
          </LLMWriter>
        );
      }}
    </LLMResearcher>
  );
  console.log("BlogWritingWorkflow: Returning result element");
  return result;
});
