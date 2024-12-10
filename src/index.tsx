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
  const [getBlogPost, setBlogPost] = createWorkflowOutput("");
  const [getTweet, setTweet] = createWorkflowOutput("");

  const workflow = (
    <Workflow>
      <BlogWritingWorkflow
        title={title}
        prompt={prompt}
        setOutput={setBlogPost}
      />
      <TweetWritingWorkflow content={getBlogPost()} setOutput={setTweet} />
    </Workflow>
  );

  // Execute the workflow
  const context = new WorkflowContext(workflow);
  await context.execute();

  console.log("Blog Post:", await getBlogPost());
  console.log("Tweet:", await getTweet());
  console.log("workflowOutputs:", workflowOutputs);
}

main().catch((error) => {
  console.error("Workflow execution failed:", error);
});
