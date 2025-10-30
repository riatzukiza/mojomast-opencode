import js from "@eslint/js"
import typescript from "@typescript-eslint/eslint-plugin"
import typescriptParser from "@typescript-eslint/parser"

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
    },
    rules: {
      // Enable some common linting rules to trigger errors
      "no-unused-vars": "off", // Turn off base version for TypeScript
      "no-console": "error",
      "prefer-const": "error",
      "no-var": "error",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
]
