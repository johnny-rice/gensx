import React from "react";

import { Workflow, WorkflowContext } from "./Workflow";
import { BlogWritingWorkflow } from "./BlogWritingWorkflow";
import { TweetWritingWorkflow } from "./TweetWritingWorkflow";

async function main() {
  const blogAndTweetWorkflow = (
    <Workflow>
      <BlogWritingWorkflow />
      <TweetWritingWorkflow />
    </Workflow>
  );

  const wfContext = new WorkflowContext(blogAndTweetWorkflow);
  await wfContext.execute();

  // Access the results
  console.log("\nWorkflow Execution Completed.\n");
  console.log("Final Outputs:");
  console.log("Edited Blog Post:", wfContext.getRef("editedBlogPost"));
  console.log("Tweet:", wfContext.getRef("tweet"));
}

main().catch((error) => {
  console.error("Workflow execution failed:", error);
});
