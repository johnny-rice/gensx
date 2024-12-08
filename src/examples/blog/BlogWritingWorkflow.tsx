import React from "react";
import { LLMResearcher } from "../shared/components/LLMResearcher";
import { LLMWriter } from "../shared/components/LLMWriter";
import { LLMEditor } from "../shared/components/LLMEditor";
import { Outputs } from "../../core/types/outputs";
import { defineWorkflow } from "../../core/utils/workflow-builder";
import { WriterOutputs } from "../shared/components/LLMWriter";

interface BlogWritingWorkflowProps {
  title: string;
  prompt: string;
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
  // TODO we gotta get rid of the need to define the refs here
  typeof refs
>(refs, (props) => {
  const { Ref } = props;

  return (
    <>
      <LLMResearcher
        title={props.title}
        prompt={props.prompt}
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
