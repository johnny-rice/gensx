// import swc from "unplugin-swc";
import * as path from "node:path";

import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    forceRerunTriggers: ["**/*.ts", "**/*.template"],
    root: path.resolve(process.cwd(), "./"),
    globals: true,
    isolate: true,
    passWithNoTests: false,
    silent: "passed-only",
    include: ["./tests/**/*.test.ts"],
    env: loadEnv("test", process.cwd(), ""),
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "istanbul",
      reporter: ["text-summary", "json-summary", "json"],
      reportsDirectory: "coverage",
      include: ["./src/**/*.ts"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "coverage/**",
        "tests/**",
        "**/*.d.ts",
      ],
      all: true,
      enabled: true,
      clean: true,
      cleanOnRerun: true,
      reportOnFailure: true,
      skipFull: false,
      extension: [".ts"],
    },
  },
});
