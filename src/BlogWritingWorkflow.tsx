import React from "react";
import { UserInput } from "./UserInput";
import { LLMResearcher } from "./LLMResearcher";
import { LLMWriter } from "./LLMWriter";
import { LLMEditor } from "./LLMEditor";
import { createRefFactory, RefType } from "./ref";
import { Outputs } from "./outputs";
import { defineWorkflow } from "./workflow-builder";

interface BlogWritingWorkflowProps {
  title: string;
  prompt: string;
}

interface WriterOutputs {
  content: string;
  metadata: {
    wordCount: number;
    readingTime: number;
    keywords: string[];
  };
}

const refs = {
  // Input refs
  blogPostTitle: {} as string,
  blogPostPrompt: {} as string,

  // Research refs
  blogResearchResult: {} as string,
  blogSources: {} as string[],
  blogSummary: {} as string,

  // Writer refs
  blogPost: {} as string,
  blogMetadata: {} as WriterOutputs["metadata"],

  // Editor refs
  editedBlogPost: {} as string,
} as const;

export const BlogWritingWorkflow = defineWorkflow<
  BlogWritingWorkflowProps,
  typeof refs
>(refs, (props) => {
  const { Ref } = props;

  return (
    <>
      <UserInput
        value={props.title}
        outputs={Outputs<typeof refs>({
          value: "blogPostTitle",
        })}
      />
      <UserInput
        value={props.prompt}
        outputs={Outputs<typeof refs>({
          value: "blogPostPrompt",
        })}
      />
      <LLMResearcher
        title={Ref("blogPostTitle")}
        prompt={Ref("blogPostPrompt")}
        outputs={Outputs<typeof refs>({
          research: "blogResearchResult",
          sources: "blogSources",
          summary: "blogSummary",
        })}
      />
      <LLMWriter
        content={Ref("blogResearchResult")}
        outputs={Outputs<typeof refs>({
          content: "blogPost",
          metadata: "blogMetadata",
        })}
      />
      <LLMEditor
        content={Ref("blogPost")}
        outputs={Outputs<typeof refs>({
          content: "editedBlogPost",
        })}
      />
    </>
  );
});
