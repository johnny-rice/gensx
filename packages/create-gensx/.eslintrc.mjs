export default {
  extends: ["../../.eslintrc.json"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: import.meta.dirname,
  },
  rules: {
    "node/shebang": [
      "error",
      {
        convertPath: { "src/*.ts": ["^src/(.+?)\\.ts$", "./dist/$1.js"] },
      },
    ],
  },
};
