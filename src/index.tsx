import React from "react";
import { Workflow, WorkflowContext } from "./Workflow";
import { BlogWritingWorkflow } from "./BlogWritingWorkflow";
import { TweetWritingWorkflow } from "./TweetWritingWorkflow";
import { getComponentRefs } from "./ref";

async function main() {
  const title = "Programmatic Secrets with ESC";
  const prompt =
    "Write an article that talks about managing and consuming secrets programmatically using the ESC typescript SDK.";

  const blogAndTweetWorkflow = (
    <Workflow>
      <BlogWritingWorkflow title={title} prompt={prompt} />
      <TweetWritingWorkflow />
    </Workflow>
  );

  type WorkflowRefs = typeof BlogWritingWorkflow.__refs &
    typeof TweetWritingWorkflow.__refs;
  const wfContext = new WorkflowContext<WorkflowRefs>(blogAndTweetWorkflow);
  await wfContext.execute();

  console.log("\nWorkflow Execution Completed.\n");
  console.log("Final Outputs:");
  console.log("Edited Blog Post:", wfContext.getRef("editedBlogPost"));
  console.log("Tweet:", wfContext.getRef("tweet"));
}

main().catch((error) => {
  console.error("Workflow execution failed:", error);
});
