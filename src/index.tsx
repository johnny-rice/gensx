import React from "react";
import { Workflow } from "./core/components/Workflow";
import { BlogWritingWorkflow } from "./examples/blog/BlogWritingWorkflow";
import { TweetWritingWorkflow } from "./examples/tweet/TweetWritingWorkflow";
import { WorkflowContext } from "./core/components/Workflow";
import { createWorkflowOutput } from "./core/hooks/useWorkflowOutput";
import { workflowOutputs } from "./core/hooks/useWorkflowOutput";

async function main() {
  const title = "Programmatic Secrets with ESC";
  const prompt = "Write an article...";

  // Create shared outputs between workflows
  const [blogPost, setBlogPost] = createWorkflowOutput("");
  const [tweet, setTweet] = createWorkflowOutput("");

  const workflow = (
    <Workflow>
      <TweetWritingWorkflow content={blogPost} setOutput={setTweet} />
      <BlogWritingWorkflow
        title={title}
        prompt={prompt}
        setOutput={setBlogPost}
      />
    </Workflow>
  );

  // Execute the workflow
  const context = new WorkflowContext(workflow);
  await context.execute();

  console.log("Blog Post:", await blogPost);
  console.log("Tweet:", await tweet);
  console.log("workflowOutputs:", workflowOutputs);
}

main().catch((error) => {
  console.error("Workflow execution failed:", error);
});
