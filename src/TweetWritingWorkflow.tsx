import React from "react";
import { LLMWriter } from "./LLMWriter";
import { defineWorkflow } from "./workflow-builder";
import { Outputs } from "./outputs";
import { WriterOutputs } from "./LLMWriter";

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
