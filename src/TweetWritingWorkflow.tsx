import React from "react";
import { UserInput } from "./UserInput";
import { LLMWriter } from "./LLMWriter";

export function TweetWritingWorkflow(): React.ReactElement {
  return (
    <>
      <UserInput
        id="tweetInput"
        prompt="Write a tweet based on the blog post."
      />
      <LLMWriter inputRef="tweetInput" outputRef="tweet" />
    </>
  );
}
