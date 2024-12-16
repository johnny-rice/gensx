<h1 align="center">LLMX</h1>

<p align="center">
  Make LLMs work good
</p>

## LLM + JSX = ⚡️

LLMX is a library for building LLM workflows, using JSX for simple and fast development.

```jsx
const title = "How to be a 10x LLM Developer";
const prompt = "Write an article about using LLMX to build LLM applications";

const workflow = (
  <Workflow>
    <BlogWritingWorkflow title={title} prompt={prompt}>
      {blogPost => (
        <TweetWritingWorkflow content={blogPost}>
          {tweet => {
            console.log("\n=== Nested Workflow Results ===");
            console.log("Tweet:", tweet);
            console.log("Blog Post:", blogPost);
            return null;
          }}
        </TweetWritingWorkflow>
      )}
    </BlogWritingWorkflow>
  </Workflow>
);

const context = new WorkflowContext(workflow);
await context.execute();
```

## 📦 Installing

```bash
pnpm install llmx

npm install llmx

yarn add llmx
```

## ⚙️ Developing

### 📦 Building

```bash
pnpm build
```

### 🧪 Testing

If you want to run the tests of the project, you can execute the following command:

```bash
pnpm test
```

### 💅 Linting

To run the linter you can execute:

```bash
pnpm lint
```

And for trying to fix lint issues automatically, you can run:

```bash
pnpm lint:fix
```
