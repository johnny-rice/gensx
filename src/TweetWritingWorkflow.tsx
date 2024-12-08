import React from "react";
import { UserInput } from "./UserInput";
import { LLMWriter } from "./LLMWriter";
import { defineWorkflow } from "./workflow-builder";

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
          id="tweetInput"
          value=""
          prompt="Write a tweet based on the blog post."
        />
        <LLMWriter
          inputRef="tweetInput"
          outputs={{
            content: "tweet",
            metadata: "tweetMetadata",
          }}
        />
      </>
    );
  }
);
