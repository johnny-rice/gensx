import { Command, Option } from "commander";
import { render } from "ink";
import React from "react";

import { BuildOptions, BuildWorkflowUI } from "./commands/build.js";
import { DeployOptions, DeployUI } from "./commands/deploy.js";
import { CreateEnvironmentUI } from "./commands/environment/create.js";
import {
  ListEnvironmentOptions,
  ListEnvironmentsUI,
} from "./commands/environment/list.js";
import { SelectEnvironmentUI } from "./commands/environment/select.js";
import { ShowEnvironmentUI } from "./commands/environment/show.js";
import { UnselectEnvironmentUI } from "./commands/environment/unselect.js";
import { headlessDeploy } from "./commands/headless-deploy.js";
import { LoginUI } from "./commands/login.js";
import { NewCommandOptions, NewProjectUI } from "./commands/new.js";
import { CreateProjectUI } from "./commands/project/create.js";
import { ListProjectsUI } from "./commands/project/list.js";
import { ShowProjectUI } from "./commands/project/show.js";
import { CliOptions, RunWorkflowUI } from "./commands/run.js";
import { StartUI } from "./commands/start.js";
import { VERSION } from "./utils/user-agent.js";

export async function runCLI() {
  const program = new Command()
    .name("gensx")
    .description("CLI tool for GenSX")
    .version(VERSION);

  program
    .command("login")
    .description("Login to GenSX Cloud")
    .action(() => {
      return new Promise<void>((resolve, reject) => {
        const { waitUntilExit } = render(React.createElement(LoginUI));
        waitUntilExit().then(resolve).catch(reject);
      });
    });

  program
    .command("new")
    .description("Create a new GenSX project")
    .argument("<project-directory>", "Directory to create the project in")
    .option("-t, --template <type>", "Template to use (typescript, next)")
    .option("-f, --force", "Overwrite existing files", false)
    .option("-s, --skip-login", "Skip login step", false)
    .option("--skip-ide-rules", "Skip IDE rules selection", false)
    .option(
      "--ide-rules <rules>",
      "Comma-separated list of IDE rules to install (cline,windsurf,claude,cursor)",
    )
    .option("-d, --description <desc>", "Optional project description")
    .action((projectPath: string, options: NewCommandOptions) => {
      return new Promise<void>((resolve, reject) => {
        const { waitUntilExit } = render(
          React.createElement(NewProjectUI, {
            projectPath,
            options,
          }),
        );
        waitUntilExit().then(resolve).catch(reject);
      });
    });

  program
    .command("start")
    .description("Start a local GenSX server")
    .argument("<file>", "File to serve")
    .option("--port <port>", "Port to run the server on", "1337")
    .option("-q, --quiet", "Suppress output", false)
    .action((file: string, options: { port: number; quiet: boolean }) => {
      return new Promise<void>((resolve, reject) => {
        const { waitUntilExit } = render(
          React.createElement(StartUI, {
            file,
            options,
          }),
          {
            patchConsole: false,
          },
        );
        waitUntilExit().then(resolve).catch(reject);
      });
    });

  program
    .command("build")
    .description("Build a GenSX project")
    .argument(
      "<file>",
      "Workflow file to build (e.g. workflow.ts). This should export a gsx.Workflow as the default export.",
    )
    .option("-o, --out-dir <dir>", "Output directory")
    .option("-t, --tsconfig <file>", "TypeScript config file")
    .option("-w, --watch", "Watch for changes", false)
    .option("-v, --verbose", "Verbose output", false)
    .option("--schema-only", "Only generate the schema", false)
    .action((file: string, options: BuildOptions) => {
      return new Promise<void>((resolve, reject) => {
        const { waitUntilExit } = render(
          React.createElement(BuildWorkflowUI, {
            file,
            options,
          }),
        );
        waitUntilExit().then(resolve).catch(reject);
      });
    });

  program
    .command("deploy")
    .description("Deploy a project to GenSX Cloud")
    .argument("<file>", "File to deploy")
    .option(
      "-e, --env-var <VALUE[=value]>",
      "Environment variable to include with deployment (can be used multiple times)",
      (val, prev: Record<string, string> = {}) => {
        let [key, value] = val.split("=") as [string, string | undefined];
        if (!key) {
          throw new Error(
            "Environment variables must be in the format KEY=value",
          );
        }
        value ??= process.env[key];
        if (value === undefined) {
          throw new Error(`Environment variable ${key} has no value.`);
        }
        return { ...prev, [key]: value };
      },
      {},
    )
    .option(
      "-a, --archive <file>",
      "Use the specified archive file instead of building the workflow. Must still specify the workflow file to properly infer the schemas.",
    )
    .option("-p, --project <name>", "Project name to deploy to")
    .option("--env <name>", "Environment name to deploy to")
    .option("-y, --yes", "Automatically answer yes to all prompts", false)
    .option("-v, --verbose", "Verbose output", false)
    .action(async (file: string, options: DeployOptions) => {
      const isNonInteractive =
        process.env.CI === "true" || !process.stdin.isTTY;
      if (isNonInteractive) {
        console.info(
          "Running in headless mode due to CI or non-TTY environment.",
        );
        try {
          await headlessDeploy(file, options);
        } catch (err) {
          console.error(err instanceof Error ? err.message : String(err));
          process.exit(1);
        }
      } else {
        return new Promise<void>((resolve, reject) => {
          const { waitUntilExit } = render(
            React.createElement(DeployUI, {
              file,
              options,
            }),
          );
          waitUntilExit().then(resolve).catch(reject);
        });
      }
    });

  program
    .command("run")
    .description("Run a workflow")
    .argument("<workflow>", "Workflow name")
    .option("-i, --input <input>", "Input to pass to the workflow", "{}")
    .option("--no-wait", "Do not wait for the workflow to finish")
    .option("-p, --project <name>", "Project name to run the workflow in")
    .option("--env <name>", "Environment name to run the workflow in")
    // Handle the three progress cases:
    // 1. No --progress flag: options.progress is undefined
    // 2. --progress (no value): options.progress is true (boolean flag)
    // 3. --progress=all: options.progress is "all"
    .addOption(
      new Option(
        "--progress [verbosity]",
        "Stream workflow events instead of just output (pass 'all' to stream all events)",
      ).choices(["all"]),
    )
    .option(
      "-o, --output <file>",
      "Output file to write the workflow result to",
      undefined,
    )
    .option("-y, --yes", "Automatically answer yes to all prompts", false)
    .action((workflow: string, options: CliOptions) => {
      return new Promise<void>((resolve, reject) => {
        if (options.progress && !options.wait) {
          console.error(
            "Cannot use --progress when using --no-wait. Progress is only supported when waiting for the workflow to finish.",
          );
          process.exit(1);
        }

        const { waitUntilExit } = render(
          React.createElement(RunWorkflowUI, {
            workflowName: workflow,
            options,
          }),
        );
        waitUntilExit().then(resolve).catch(reject);
      });
    });

  // Environment management commands
  const environmentCommand = program
    .command("env")
    .description("Manage GenSX environments")
    .action(async () => {
      return new Promise<void>((resolve, reject) => {
        const { waitUntilExit } = render(
          React.createElement(ShowEnvironmentUI, {
            projectName: undefined,
          }),
        );
        waitUntilExit().then(resolve).catch(reject);
      });
    });

  environmentCommand
    .command("create")
    .description("Create a new environment")
    .argument("<name>", "Name of the environment")
    .option("-p, --project <name>", "Project name")
    .action(async (name: string, options: { project?: string }) => {
      return new Promise<void>((resolve, reject) => {
        const { waitUntilExit } = render(
          React.createElement(CreateEnvironmentUI, {
            environmentName: name,
            projectName: options.project,
          }),
        );
        waitUntilExit().then(resolve).catch(reject);
      });
    });

  environmentCommand
    .command("ls")
    .description("List all environments")
    .option("-p, --project <name>", "Project name")
    .action(async (options: ListEnvironmentOptions) => {
      return new Promise<void>((resolve, reject) => {
        const { waitUntilExit } = render(
          React.createElement(ListEnvironmentsUI, {
            projectName: options.project,
          }),
        );
        waitUntilExit().then(resolve).catch(reject);
      });
    });

  environmentCommand
    .command("select")
    .description("Select an environment as active")
    .argument("<name>", "Name of the environment to select")
    .option("-p, --project <name>", "Project name")
    .action(async (name: string, options: { project?: string }) => {
      return new Promise<void>((resolve, reject) => {
        const { waitUntilExit } = render(
          React.createElement(SelectEnvironmentUI, {
            environmentName: name,
            projectName: options.project,
          }),
        );
        waitUntilExit().then(resolve).catch(reject);
      });
    });

  environmentCommand
    .command("unselect")
    .description("Unselect an environment")
    .option("-p, --project <name>", "Project name")
    .action(async (options: { project?: string }) => {
      return new Promise<void>((resolve, reject) => {
        const { waitUntilExit } = render(
          React.createElement(UnselectEnvironmentUI, {
            projectName: options.project,
          }),
        );
        waitUntilExit().then(resolve).catch(reject);
      });
    });

  // Project management commands
  const projectCommand = program
    .command("project")
    .description("Manage GenSX projects")
    .option("-p, --project <name>", "Project name")
    .action(async (options: { project?: string }) => {
      return new Promise<void>((resolve, reject) => {
        const { waitUntilExit } = render(
          React.createElement(ShowProjectUI, {
            projectName: options.project,
          }),
        );
        waitUntilExit().then(resolve).catch(reject);
      });
    });

  projectCommand
    .command("ls")
    .description("List all projects")
    .action(async () => {
      return new Promise<void>((resolve, reject) => {
        const { waitUntilExit } = render(React.createElement(ListProjectsUI));
        waitUntilExit().then(resolve).catch(reject);
      });
    });

  projectCommand
    .command("create")
    .description("Create a new project")
    .argument(
      "[name]",
      "Name of the project (optional if specified in gensx.yaml)",
    )
    .option("-d, --description <desc>", "Optional project description")
    .option("--env <name>", "Initial environment name")
    .option("-y, --yes", "Automatically answer yes to all prompts", false)
    .action(
      async (
        name?: string,
        options?: { description?: string; env?: string; yes?: boolean },
      ) => {
        return new Promise<void>((resolve, reject) => {
          const { waitUntilExit } = render(
            React.createElement(CreateProjectUI, {
              projectName: name,
              description: options?.description,
              environmentName: options?.env,
              yes: options?.yes,
            }),
          );
          waitUntilExit().then(resolve).catch(reject);
        });
      },
    );

  await program.parseAsync();
}

export { NewProjectUI };

export type { NewCommandOptions };
