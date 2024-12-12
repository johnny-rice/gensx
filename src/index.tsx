import React from "react";
import { Workflow } from "./core/components/Workflow";
import { BlogWritingWorkflow } from "./examples/blog/BlogWritingWorkflow";
import { TweetWritingWorkflow } from "./examples/tweet/TweetWritingWorkflow";
import { WorkflowContext } from "./core/components/Workflow";
import { createWorkflowOutput } from "./core/hooks/useWorkflowOutput";
import { workflowOutputs } from "./core/hooks/useWorkflowOutput";

async function runParallelWorkflow() {
  console.log("\n=== Running Parallel Workflow ===");
  const title = "Programmatic Secrets with ESC";
  const prompt = "Write an article...";

  // Create shared outputs between workflows
  const [blogPost, setBlogPost] = createWorkflowOutput("");
  const [tweet, setTweet] = createWorkflowOutput("");

  const workflow = (
    <Workflow>
      <BlogWritingWorkflow
        title={title}
        prompt={prompt}
        setOutput={setBlogPost}
      />
      <TweetWritingWorkflow content={blogPost} setOutput={setTweet} />
    </Workflow>
  );

  // Execute the workflow
  const context = new WorkflowContext(workflow);
  try {
    await context.execute();
    console.log("Blog Post:", await blogPost);
    console.log("Tweet:", await tweet);
  } catch (error) {
    console.error("Error in parallel workflow:", error);
    throw error; // Re-throw to ensure main catches it
  }
}

async function runNestedWorkflow() {
  console.log("\n=== Running Nested Workflow ===");
  const title = "Programmatic Secrets with ESC";
  const prompt = "Write an article...";

  // In nested workflow, we only need the tweet output
  const [tweet, setTweet] = createWorkflowOutput("");

  const workflow = (
    <Workflow>
      <BlogWritingWorkflow title={title} prompt={prompt}>
        {({ output }) => (
          <TweetWritingWorkflow content={output} setOutput={setTweet} />
        )}
      </BlogWritingWorkflow>
    </Workflow>
  );

  // Execute the workflow
  const context = new WorkflowContext(workflow);
  try {
    await context.execute();
    console.log("Tweet:", await tweet);
  } catch (error) {
    console.error("Error in nested workflow:", error);
    throw error;
  }
}

async function main() {
  try {
    await runParallelWorkflow();
    console.log("Parallel workflow completed successfully");
    console.log("\nFinal workflowOutputs:", workflowOutputs);
    await runNestedWorkflow();
    console.log("Nested workflow completed successfully");
    console.log("\nFinal workflowOutputs:", workflowOutputs);
  } catch (error) {
    console.error("Workflow execution failed:", error);
    process.exit(1); // Exit with error code
  } finally {
    console.log("\nFinal workflowOutputs:", workflowOutputs);
  }
}

main().catch((error) => {
  console.error("Unhandled error in main:", error);
  process.exit(1);
});
