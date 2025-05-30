import fs from "node:fs/promises";
import path from "node:path";

import { render } from "ink-testing-library";
import React from "react";
import { beforeEach, expect, it, suite, vi } from "vitest";

import { RunWorkflowUI } from "../../src/commands/run.js";
import * as environmentModel from "../../src/models/environment.js";
import * as projectModel from "../../src/models/projects.js";
import * as envConfig from "../../src/utils/env-config.js";
import * as projectConfig from "../../src/utils/project-config.js";
import { tempDir } from "../setup.js";
import { waitForText } from "../test-helpers.js";

// Mock dependencies
vi.mock("../../src/utils/env-config.js", () => ({
  getSelectedEnvironment: vi.fn(),
  getEnvironmentForOperation: vi.fn(),
}));

vi.mock("../../src/utils/project-config.js", () => ({
  readProjectConfig: vi.fn(),
}));

vi.mock("../../src/models/projects.js", () => ({
  checkProjectExists: vi.fn(),
}));

vi.mock("../../src/models/environment.js", () => ({
  checkEnvironmentExists: vi.fn(),
  listEnvironments: vi.fn(),
}));

// Mock EnvironmentResolver component
vi.mock("../../src/components/EnvironmentResolver.js", () => ({
  EnvironmentResolver: ({
    onResolved,
  }: {
    onResolved: (env: string) => void;
  }) => {
    React.useEffect(() => {
      const resolveId = setTimeout(() => {
        onResolved("development");
      }, 0);
      return () => {
        clearTimeout(resolveId);
      };
    }, []);
    return null;
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();

// Mock TextDecoder properly
class MockTextDecoder {
  encoding = "utf-8";
  fatal = false;
  ignoreBOM = false;
  decode(): string {
    return "mocked output";
  }
}
global.TextDecoder = MockTextDecoder as unknown as typeof TextDecoder;

suite("run command", () => {
  let outputPath: string;

  beforeEach(() => {
    global.fetch = mockFetch;
    // Setup common mocks
    vi.mocked(projectModel.checkProjectExists).mockResolvedValue(true);
    vi.mocked(environmentModel.checkEnvironmentExists).mockResolvedValue(true);
    vi.mocked(environmentModel.listEnvironments).mockResolvedValue([
      {
        name: "development",
        id: "dev-123",
        projectId: "test-project",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    vi.mocked(envConfig.getSelectedEnvironment).mockResolvedValue(
      "development",
    );
    // Add default project config
    vi.mocked(projectConfig.readProjectConfig).mockResolvedValue({
      projectName: "test-project",
    });

    // Set up output path using global tempDir
    outputPath = path.join(tempDir, "output.json");
  });

  it("should fail if no project name is available", async () => {
    // Mock empty project config
    vi.mocked(projectConfig.readProjectConfig).mockResolvedValue(null);
    vi.mocked(projectModel.checkProjectExists).mockResolvedValue(false);

    const { lastFrame } = render(
      React.createElement(RunWorkflowUI, {
        workflowName: "test-workflow",
        options: {
          input: "{}",
          wait: false,
        },
      }),
    );

    // Add logging to see what's being rendered
    console.info("Initial rendered output:", lastFrame());

    // Wait for error message
    await waitForText(lastFrame, /No project name found/);
    console.info("Final rendered output:", lastFrame());
  });

  it("should handle JSON response when wait is true", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      headers: new Headers({ "Content-Type": "application/json" }),
      json: () =>
        Promise.resolve({
          output: { result: "success" },
          executionStatus: "success",
        }),
    });

    const { lastFrame } = render(
      React.createElement(RunWorkflowUI, {
        workflowName: "test-workflow",
        options: {
          input: "{}",
          wait: true,
          env: "development",
        },
      }),
    );

    await waitForText(lastFrame, /Workflow execution completed/);
  });

  it("should handle failed workflow execution", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      headers: new Headers({ "Content-Type": "application/json" }),
      json: () =>
        Promise.resolve({
          output: { error: "Something went wrong" },
          executionStatus: "failed",
        }),
    });

    const { lastFrame } = render(
      React.createElement(RunWorkflowUI, {
        workflowName: "test-workflow",
        options: {
          input: "{}",
          wait: true,
        },
      }),
    );

    await waitForText(lastFrame, /Workflow failed/);
  });

  it("should write output to file when specified", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      headers: new Headers({ "Content-Type": "application/json" }),
      json: () =>
        Promise.resolve({
          output: { result: "success" },
          executionStatus: "success",
        }),
    });

    const { lastFrame } = render(
      React.createElement(RunWorkflowUI, {
        workflowName: "test-workflow",
        options: {
          input: "{}",
          wait: true,
          output: outputPath,
        },
      }),
    );

    await waitForText(lastFrame, /output.json/);

    // Verify the file was written with correct content
    const content = await fs.readFile(outputPath, "utf-8");
    expect(JSON.parse(content)).toEqual({ result: "success" });
  });

  it("should handle API errors", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 400,
      statusText: "Bad Request",
      json: () => Promise.resolve({ error: "Bad Request" }),
    });

    const { lastFrame } = render(
      React.createElement(RunWorkflowUI, {
        workflowName: "test-workflow",
        options: {
          input: "{}",
          wait: false,
        },
      }),
    );

    await waitForText(lastFrame, /Failed to start workflow/);
  });

  it("should show first-time setup when user hasn't completed setup", async () => {
    // Update config file to show first-time setup not completed
    const configPath = path.join(process.env.GENSX_CONFIG_DIR!, "config");
    await fs.writeFile(
      configPath,
      `; GenSX Configuration File
; Generated on: ${new Date().toISOString()}

[api]
token = test-token
org = test-org
baseUrl = https://api.test.com

[console]
baseUrl = https://console.test.com

[state]
hasCompletedFirstTimeSetup = false
`,
      "utf-8",
    );

    const { lastFrame } = render(
      React.createElement(RunWorkflowUI, {
        workflowName: "test-workflow",
        options: {
          input: "{}",
          wait: false,
        },
      }),
    );

    // Wait for the welcome message
    await waitForText(
      lastFrame,
      /Welcome to GenSX! Let's get you set up first./,
    );
  });
});
