import React from "react";
import { UserInput } from "./UserInput";
import { LLMResearcher } from "./LLMResearcher";
import { LLMWriter } from "./LLMWriter";
import { LLMEditor } from "./LLMEditor";

export function BlogWritingWorkflow(): React.ReactElement {
  return (
    <>
      <UserInput id="blogUserInput" prompt="What is the weather in Tokyo?" />
      <LLMResearcher inputRef="blogUserInput" outputRef="blogResearchResult" />
      <LLMWriter inputRef="blogResearchResult" outputRef="blogPost" />
      <LLMEditor inputRef="blogPost" outputRef="editedBlogPost" />
    </>
  );
}
