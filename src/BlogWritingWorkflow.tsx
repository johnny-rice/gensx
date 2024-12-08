import React from "react";
import { UserInput } from "./UserInput";
import { LLMResearcher } from "./LLMResearcher";
import { LLMWriter } from "./LLMWriter";
import { LLMEditor } from "./LLMEditor";
import { Ref } from "./ref";
import { Outputs } from "./outputs";
import { defineWorkflow } from "./workflow-builder";

interface BlogWritingWorkflowProps {
  title: string;
  prompt: string;
}

interface ResearchOutputs {
  research: string;
  sources: string[];
  summary: string;
}

interface WriterOutputs {
  content: string;
  metadata: {
    wordCount: number;
    readingTime: number;
    keywords: string[];
  };
}

export const BlogWritingWorkflow = defineWorkflow(
  {
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
  },
  (props: BlogWritingWorkflowProps) => {
    return (
      <>
        <UserInput id="blogPostTitle" value={props.title} />
        <UserInput id="blogPostPrompt" value={props.prompt} />
        <LLMResearcher
          title={Ref("blogPostTitle")}
          prompt={Ref("blogPostPrompt")}
          outputs={Outputs<ResearchOutputs>({
            research: "blogResearchResult",
            sources: "blogSources",
            summary: "blogSummary",
          })}
        />
        <LLMWriter
          inputRef="blogResearchResult"
          outputs={Outputs<WriterOutputs>({
            content: "blogPost",
            metadata: "blogMetadata",
          })}
        />
        <LLMEditor inputRef="blogPost" outputRef="editedBlogPost" />
      </>
    );
  }
);
