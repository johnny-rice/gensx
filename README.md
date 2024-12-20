<h1 align="center">GenSX</h1>

<p align="center">
  Make LLMs work good
</p>

## LLM + JSX = ⚡️

GenSX is a library for building LLM workflows, using JSX for simple and fast development.

```jsx
import * as gsx from "gensx";

const title = "How to be a 10x LLM Developer";
const prompt = "Write an article about using gensx to build LLM applications";

const [tweet, blogPost] = await gsx.execute(
  <BlogWritingWorkflow title={title} prompt={prompt}>
    {blogPost => (
      <TweetWritingWorkflow content={blogPost}>
        {tweet => {
          return [tweet, blogPost];
        }}
      </TweetWritingWorkflow>
    )}
  </BlogWritingWorkflow>,
);
```

## 📦 Installing

```bash
pnpm install gensx

npm install gensx

yarn add gensx
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
