import fs from "node:fs/promises";
import path from "node:path";

import { render } from "ink-testing-library";
import React from "react";
import { expect, it, suite, vi } from "vitest";

import { SelectEnvironmentUI } from "../../../src/commands/environment/select.js";
import * as environmentModel from "../../../src/models/environment.js";
import * as projectModel from "../../../src/models/projects.js";
import { tempDir } from "../../setup.js";
import { waitForText } from "../../test-helpers.js";

// Mock only the dependencies that would make API calls
vi.mock("../../../src/models/projects.js", () => ({
  checkProjectExists: vi.fn(),
}));

vi.mock("../../../src/models/environment.js", () => ({
  checkEnvironmentExists: vi.fn(),
}));

// Mock validateAndSelectEnvironment by overriding it for testing
// This function is needed because we can't easily mock env-config
// and still allow file operations to work
vi.mock("../../../src/utils/env-config.js", async () => {
  const original = await vi.importActual("../../../src/utils/env-config.js");
  return {
    ...original,
    validateAndSelectEnvironment: vi.fn(
      async (projectName: string, envName: string) => {
        // Check if we have a mock for checkEnvironmentExists
        const envExists = await environmentModel.checkEnvironmentExists(
          projectName,
          envName,
        );

        if (envExists) {
          // If environment exists, update the real config file
          const projectsDir = path.join(tempDir, ".gensx", "projects");
          await fs.writeFile(
            path.join(projectsDir, `${projectName}.json`),
            JSON.stringify({ selectedEnvironment: envName }),
            "utf-8",
          );
          return true;
        }

        return false;
      },
    ),
  };
});

suite("environment select command", () => {
  it("should select environment for an existing project", async () => {
    // Mock project exists
    vi.mocked(projectModel.checkProjectExists).mockResolvedValue(true);

    // Mock environment exists
    vi.mocked(environmentModel.checkEnvironmentExists).mockResolvedValue(true);

    const { lastFrame } = render(
      React.createElement(SelectEnvironmentUI, {
        environmentName: "development",
        projectName: "test-project",
      }),
    );

    // Verify UI shows success message
    await waitForText(
      lastFrame,
      /Environment development is now active for project test-project/,
    );

    // Verify file was created with correct content
    const projectsDir = path.join(tempDir, ".gensx", "projects");
    const fileContent = await fs.readFile(
      path.join(projectsDir, "test-project.json"),
      "utf-8",
    );
    const parsed = JSON.parse(fileContent) as { selectedEnvironment: string };
    expect(parsed.selectedEnvironment).toBe("development");
  });

  it("should use project name from config when not specified", async () => {
    // Create a real gensx.yaml config file
    await fs.writeFile(
      path.join(tempDir, "project", "gensx.yaml"),
      `# GenSX Project Configuration
  projectName: config-project
  `,
      "utf-8",
    );

    // Mock project exists
    vi.mocked(projectModel.checkProjectExists).mockResolvedValue(true);

    // Mock environment doesn't exist
    vi.mocked(environmentModel.checkEnvironmentExists).mockResolvedValue(false);

    const { lastFrame } = render(
      React.createElement(SelectEnvironmentUI, {
        environmentName: "staging",
      }),
    );

    // Wait for the error message to appear
    await waitForText(
      lastFrame,
      "Environment staging does not exist in project config-project",
    );
  });

  it("should show error when no project is specified and none in config", async () => {
    // No gensx.yaml file, so it will fail to find a project
    const { lastFrame } = render(
      React.createElement(SelectEnvironmentUI, {
        environmentName: "production",
      }),
    );

    await waitForText(
      lastFrame,
      /No project name found\. Either specify --project or create a gensx\.yaml file with a 'projectName' field\./,
    );
  });

  it("should show error when project does not exist", async () => {
    // Mock project does not exist
    vi.mocked(projectModel.checkProjectExists).mockResolvedValue(false);

    const { lastFrame } = render(
      React.createElement(SelectEnvironmentUI, {
        environmentName: "development",
        projectName: "non-existent",
      }),
    );

    await waitForText(lastFrame, /Project non-existent does not exist/);
  });

  it("should show error when environment does not exist", async () => {
    // Mock project exists
    vi.mocked(projectModel.checkProjectExists).mockResolvedValue(true);

    // Mock environment doesn't exist
    vi.mocked(environmentModel.checkEnvironmentExists).mockResolvedValue(false);

    const { lastFrame } = render(
      React.createElement(SelectEnvironmentUI, {
        environmentName: "non-existent-env",
        projectName: "test-project",
      }),
    );

    await waitForText(
      lastFrame,
      /Environment non-existent-env does not exist in project test-project/,
    );
  });

  it("should show loading spinner initially", () => {
    // Mock project exists but never completes to simulate loading state
    vi.mocked(projectModel.checkProjectExists).mockImplementation(
      () =>
        new Promise<boolean>(() => {
          /* never resolves */
        }),
    );

    const { lastFrame } = render(
      React.createElement(SelectEnvironmentUI, {
        environmentName: "development",
        projectName: "test-project",
      }),
    );

    // Check for spinner indicator
    expect(lastFrame()).toBeTruthy();
    expect(lastFrame()?.length).toBeGreaterThan(0);
  });
});
