import React from "react";
import { LLMWriter } from "../shared/components/LLMWriter";
import { defineWorkflow } from "../../core/utils/workflow-builder";
import { Outputs } from "../../core/types/outputs";
import { WriterOutputs } from "../shared/components/LLMWriter";

interface TweetWritingWorkflowProps {
  content: string;
}

const refs = {
  // Writer refs
  tweet: {} as string,
  tweetMetadata: {} as WriterOutputs["metadata"],
} as const;

export const TweetWritingWorkflow = defineWorkflow<
  TweetWritingWorkflowProps,
  typeof refs
>(refs, (props) => {
  const { Ref } = props;

  return (
    <>
      <LLMWriter
        content={props.content}
        outputs={Outputs<typeof refs>({
          content: "tweet",
          metadata: "tweetMetadata",
        })}
      />
    </>
  );
});
