import React from "react";
import { Workflow, WorkflowContext } from "./core/components/Workflow";
import { BlogWritingWorkflow } from "./examples/blog/BlogWritingWorkflow";
import { TweetWritingWorkflow } from "./examples/tweet/TweetWritingWorkflow";
import { Ref } from "./core/types/ref";

async function main() {
  const title = "Programmatic Secrets with ESC";
  const prompt =
    "Write an article that talks about managing and consuming secrets programmatically using the ESC typescript SDK.";

  const blogAndTweetWorkflow = (
    <Workflow>
      <BlogWritingWorkflow title={title} prompt={prompt} />
      <TweetWritingWorkflow content={Ref("editedBlogPost")} />
    </Workflow>
  );

  const wfContext = new WorkflowContext(blogAndTweetWorkflow);
  await wfContext.execute();

  console.log("\nWorkflow Execution Completed.\n");
  console.log("Final Outputs:");
  console.log("Edited Blog Post:", wfContext.getRef("editedBlogPost"));
  console.log("Tweet:", wfContext.getRef("tweet"));
}

main().catch((error) => {
  console.error("Workflow execution failed:", error);
});
