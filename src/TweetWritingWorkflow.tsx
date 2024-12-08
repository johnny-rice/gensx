import React from "react";
import { UserInput } from "./UserInput";
import { LLMWriter } from "./LLMWriter";
import { defineWorkflow } from "./workflow-builder";
import { Ref } from "./ref";
import { Outputs } from "./outputs";

export const TweetWritingWorkflow = defineWorkflow(
  {
    tweetInput: {} as string,
    tweet: {} as string,
    tweetMetadata: {} as {
      wordCount: number;
      readingTime: number;
      keywords: string[];
    },
  },
  () => {
    return (
      <>
        <UserInput
          value=""
          prompt="Write a tweet based on the blog post."
          outputs={Outputs({
            value: "tweetInput",
          })}
        />
        <LLMWriter
          content={Ref("tweetInput")}
          outputs={Outputs({
            content: "tweet",
            metadata: "tweetMetadata",
          })}
        />
      </>
    );
  }
);
