# OpenRouter Example

This example demonstrates how to use [OpenRouter](https://openrouter.ai) with [GenSX](https://gensx.com).

## Overview

The `OpenRouterCompletion` workflow takes a `userInput` as input and returns the model's response. The workflow:

1. Processes your input using the Claude 3.7 Sonnet model through OpenRouter
2. Returns the model's response

## Getting Started

1. Log in to GenSX (if you haven't already):

   ```bash
   npx gensx login
   ```

2. Install the required dependencies:

   ```bash
   pnpm install
   ```

3. Set up your environment variables:

   ```bash
   export OPENROUTER_API_KEY=your-api-key
   ```

## Running in GenSX Cloud

To run the workflow in GenSX Cloud:

1. Deploy your workflow:

   ```bash
   pnpm run deploy
   ```

2. Call the workflow:

   ```bash
   gensx run OpenRouterCompletion --input '{"userInput": "Write me a blog post about the future of AI."}'
   ```

Once deployed, you can go to the [GenSX console](https://app.gensx.com) to see your workflow, test it, analyze traces, and get code snippets.

## Running locally

### Test the workflow directly

You can run the workflow directly using the example code:

```bash
pnpm run dev
```

### Run the API locally

You can also test the workflow through a local API server:

```bash
pnpm run start
```

This will start a local API server and you can call the workflow APIs via curl or any HTTP client:

```bash
curl -X POST http://localhost:1337/workflows/OpenRouterCompletion \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "Write me a blog post about the future of AI."
  }'
```

A swagger UI will also be available at [http://localhost:1337/swagger-ui](http://localhost:1337/swagger-ui) to view the API details and test the workflow.

## Output Format

The workflow returns an object with a single field:

- `response`: The model's response to your input

## Learn More

- [GenSX Documentation](https://gensx.com/docs)
- [OpenRouter Documentation](https://openrouter.ai/docs)
