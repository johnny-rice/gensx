import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

// Custom plugin to emit package.json files
const emitModulePackageJson = () => ({
  name: "emit-module-package-json",
  generateBundle(options) {
    const packageJson = {
      type: options.format === "es" ? "module" : "commonjs",
    };

    this.emitFile({
      type: "asset",
      fileName: "package.json",
      source: JSON.stringify(packageJson, null, 2),
    });
  },
});

const createConfig = (format, inputs, packageName, external) => ({
  input: inputs,
  output: {
    dir: `dist/${format === "es" ? "esm" : "cjs"}`,
    format,
    sourcemap: true,
    preserveModules: true,
    preserveModulesRoot: "src",
    chunkFileNames: `[name].${format === "es" ? "js" : "cjs"}`,
    entryFileNames: `[name].${format === "es" ? "js" : "cjs"}`,
    sourcemapPathTransform: (relativeSourcePath) => {
      // Transform source paths to be relative to the package root
      return `${packageName}/${relativeSourcePath}`;
    },
    intro: `/**
* Check out the docs at https://www.gensx.com/docs
* Find us on Github https://github.com/gensx-inc/gensx
* Find us on Discord https://discord.gg/F5BSU8Kc
*/`,
  },
  external: (id) => {
    // Ensure all external dependencies and their subpaths are excluded
    return external.some((ext) =>
      typeof ext === "string"
        ? id === ext || id.startsWith(`${ext}/`)
        : ext.test(id),
    );
  },
  plugins: [
    nodeResolve({
      preferBuiltins: true,
      exportConditions: ["node"],
    }),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.build.json",
      sourceMap: true,
      noEmitOnError: true,
      outDir: `dist/${format === "es" ? "esm" : "cjs"}`,
      compilerOptions: {
        module: "NodeNext",
        moduleResolution: "NodeNext",
        sourceRoot: "../../../src",
      },
    }),
    emitModulePackageJson(),
  ],
});

export const createConfigs = (inputs, packageName, external) => [
  createConfig("es", inputs, packageName, external),
  createConfig("cjs", inputs, packageName, external),
];
