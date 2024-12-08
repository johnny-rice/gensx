import React from "react";
import { UserInput } from "./UserInput";
import { LLMWriter } from "./LLMWriter";
import { defineWorkflow } from "./workflow-builder";
import { Outputs } from "./outputs";
import { WriterOutputs } from "./LLMWriter";

const refs = {
  // Input refs
  tweetInput: {} as string,

  // Writer refs
  tweet: {} as string,
  tweetMetadata: {} as WriterOutputs["metadata"],
} as const;

export const TweetWritingWorkflow = defineWorkflow<{}, typeof refs>(
  refs,
  (props) => {
    const { Ref } = props;

    return (
      <>
        <UserInput
          value=""
          prompt="Write a tweet based on the blog post."
          outputs={Outputs<typeof refs>({
            value: "tweetInput",
          })}
        />
        <LLMWriter
          content={Ref("tweetInput")}
          outputs={Outputs<typeof refs>({
            content: "tweet",
            metadata: "tweetMetadata",
          })}
        />
      </>
    );
  }
);
