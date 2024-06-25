import { configs as eslintRecommended } from "@eslint/js";
import typescriptParser from "@typescript-eslint/parser";
import { rules as typescriptRules, configs as typescriptConfigs } from "@typescript-eslint/eslint-plugin";
import simpleImportSort from "eslint-plugin-simple-import-sort";

export default [
  eslintRecommended.recommended,
  typescriptConfigs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: typescriptParser,
      globals: {
        navigation: "readonly",
        NavigateEvent: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptRules,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "n/no-callback-literal": "off",
      "no-empty": "warn",
      "prefer-const": ["error", { destructuring: "all" }],
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
];
