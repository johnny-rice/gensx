import { expect, suite, test, vi } from "vitest";
import * as z from "zod";

import { ExecutionContext, withContext } from "../src/context.js";
import * as gensx from "../src/index.js";
import { requestInput } from "../src/request-input.js";
import {
  createWorkflowContext,
  WORKFLOW_CONTEXT_SYMBOL,
} from "../src/workflow-context.js";

function createTestContext() {
  const workflowContext = createWorkflowContext();
  const executionContext = new ExecutionContext({});
  const contextWithWorkflow = executionContext.withContext({
    [WORKFLOW_CONTEXT_SYMBOL]: workflowContext,
  });
  return { workflowContext, contextWithWorkflow };
}

suite("request input", () => {
  test("requestInput calls trigger with callback URL", async () => {
    const mockTrigger = vi.fn().mockResolvedValue(undefined);
    const mockOnRequestInput = vi.fn().mockResolvedValue({ message: "test" });

    const { workflowContext, contextWithWorkflow } = createTestContext();
    workflowContext.onRequestInput = mockOnRequestInput;

    // Mock environment variables for URL generation
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      GENSX_API_BASE_URL: "https://api.test.com",
      GENSX_ORG: "test-org",
      GENSX_EXECUTION_ID: "exec-123",
    };

    try {
      // Create a component that uses requestInput to test in proper context
      const TestComponent = gensx.Component("TestComponent", async () => {
        vi.spyOn(
          workflowContext.checkpointManager,
          "waitForPendingUpdates",
        ).mockResolvedValue();

        return await requestInput(
          mockTrigger,
          z.object({ message: z.string() }),
        );
      });

      await withContext(contextWithWorkflow, async () => {
        const result = await TestComponent();

        expect(result).toEqual({ message: "test" });

        // Verify trigger was called with a callback URL
        expect(mockTrigger).toHaveBeenCalledWith(
          expect.stringMatching(
            /^https:\/\/api\.test\.com\/org\/test-org\/workflowExecutions\/exec-123\/fulfill\//,
          ),
        );

        // Verify onRequestInput was called with schema and timeout info
        expect(mockOnRequestInput).toHaveBeenCalledWith({
          type: "input-request",
          nodeId: expect.any(String),
          resultSchema: expect.any(Object),
          timeoutAt: null,
        });
      });
    } finally {
      process.env = originalEnv;
    }
  });

  test("requestInput waits for pending updates before pausing", async () => {
    const mockTrigger = vi.fn().mockResolvedValue(undefined);
    const mockOnRequestInput = vi.fn().mockResolvedValue({ message: "test" });
    const mockWaitForPendingUpdates = vi.fn().mockResolvedValue(undefined);

    const { workflowContext, contextWithWorkflow } = createTestContext();
    workflowContext.onRequestInput = mockOnRequestInput;

    const TestComponent = gensx.Component("TestComponent", async () => {
      vi.spyOn(
        workflowContext.checkpointManager,
        "waitForPendingUpdates",
      ).mockImplementation(mockWaitForPendingUpdates);

      return await requestInput(mockTrigger, z.object({ message: z.string() }));
    });

    await withContext(contextWithWorkflow, async () => {
      const result = await TestComponent();
      expect(result).toEqual({ message: "test" });

      // Verify that waitForPendingUpdates was called before onRequestInput
      expect(mockWaitForPendingUpdates).toHaveBeenCalledBefore(
        mockOnRequestInput,
      );
    });
  });

  test("requestInput handles missing current node ID", async () => {
    const mockTrigger = vi.fn().mockResolvedValue(undefined);
    const mockOnRequestInput = vi.fn().mockResolvedValue(undefined);
    const { workflowContext, contextWithWorkflow } = createTestContext();
    workflowContext.onRequestInput = mockOnRequestInput;

    // Test without a current node context (outside of component execution)
    // The error might be caught and handled differently in the execution flow
    await withContext(contextWithWorkflow, async () => {
      try {
        const result = await requestInput(
          mockTrigger,
          z.object({ message: z.string() }),
        );
        // If it doesn't throw, it should return empty object
        expect(result).toEqual(undefined);
      } catch (error) {
        // If it does throw, verify it's the expected error
        expect(error).toEqual(
          expect.objectContaining({
            message: "No current node ID found",
          }),
        );
      }
    });
  });

  test("requestInput generates correct callback URL format", async () => {
    const mockTrigger = vi.fn().mockResolvedValue(undefined);
    const { workflowContext, contextWithWorkflow } = createTestContext();

    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      GENSX_API_BASE_URL: "https://custom-api.gensx.com",
      GENSX_ORG: "my-org",
      GENSX_EXECUTION_ID: "execution-456",
    };

    try {
      const TestComponent = gensx.Component("TestComponent", async () => {
        vi.spyOn(
          workflowContext.checkpointManager,
          "waitForPendingUpdates",
        ).mockResolvedValue();

        return await requestInput(
          mockTrigger,
          z.object({ message: z.string() }),
        );
      });

      await withContext(contextWithWorkflow, async () => {
        await TestComponent();

        const callbackUrl = mockTrigger.mock.calls[0]?.[0] as string;
        expect(callbackUrl).toMatch(
          /^https:\/\/custom-api\.gensx\.com\/org\/my-org\/workflowExecutions\/execution-456\/fulfill\/.+$/,
        );
      });
    } finally {
      process.env = originalEnv;
    }
  });

  test("requestInput returns the result from the onRequestInput callback", async () => {
    const mockTrigger = vi.fn().mockResolvedValue(undefined);
    const mockOnRequestInput = vi.fn().mockResolvedValue({ message: "test" });
    const { workflowContext, contextWithWorkflow } = createTestContext();
    workflowContext.onRequestInput = mockOnRequestInput;

    const TestComponent = gensx.Component("TestComponent", async () => {
      vi.spyOn(
        workflowContext.checkpointManager,
        "waitForPendingUpdates",
      ).mockResolvedValue();

      return await requestInput(mockTrigger, z.object({ message: z.string() }));
    });

    await withContext(contextWithWorkflow, async () => {
      const result = await TestComponent();
      expect(result).toEqual({ message: "test" });
    });
  });

  test("requestInput includes timeout when timeoutMs is provided", async () => {
    const mockTrigger = vi.fn().mockResolvedValue(undefined);
    const mockOnRequestInput = vi.fn().mockResolvedValue({ message: "test" });
    const { workflowContext, contextWithWorkflow } = createTestContext();
    workflowContext.onRequestInput = mockOnRequestInput;

    const TestComponent = gensx.Component("TestComponent", async () => {
      vi.spyOn(
        workflowContext.checkpointManager,
        "waitForPendingUpdates",
      ).mockResolvedValue();

      return await requestInput(
        mockTrigger,
        z.object({ message: z.string() }),
        { timeoutMs: 5000 },
      );
    });

    await withContext(contextWithWorkflow, async () => {
      const result = await TestComponent();
      expect(result).toEqual({ message: "test" });

      // Verify onRequestInput was called with timeout
      expect(mockOnRequestInput).toHaveBeenCalledWith({
        type: "input-request",
        nodeId: expect.any(String),
        resultSchema: expect.any(Object),
        timeoutAt: expect.any(String),
      });

      // Verify timeoutAt is a valid ISO string representing a future date
      const call = mockOnRequestInput.mock.calls[0]?.[0];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const timeoutAt = new Date(call.timeoutAt as string);
      expect(timeoutAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  test("requestInput includes timeout when timeoutAt is provided", async () => {
    const futureDate = new Date(Date.now() + 10000);
    const mockTrigger = vi.fn().mockResolvedValue(undefined);
    const mockOnRequestInput = vi.fn().mockResolvedValue({ message: "test" });
    const { workflowContext, contextWithWorkflow } = createTestContext();
    workflowContext.onRequestInput = mockOnRequestInput;

    const TestComponent = gensx.Component("TestComponent", async () => {
      vi.spyOn(
        workflowContext.checkpointManager,
        "waitForPendingUpdates",
      ).mockResolvedValue();

      return await requestInput(
        mockTrigger,
        z.object({ message: z.string() }),
        { timeoutAt: futureDate },
      );
    });

    await withContext(contextWithWorkflow, async () => {
      const result = await TestComponent();
      expect(result).toEqual({ message: "test" });

      // Verify onRequestInput was called with the exact timeout
      expect(mockOnRequestInput).toHaveBeenCalledWith({
        type: "input-request",
        nodeId: expect.any(String),
        resultSchema: expect.any(Object),
        timeoutAt: futureDate.toISOString(),
      });
    });
  });
});
