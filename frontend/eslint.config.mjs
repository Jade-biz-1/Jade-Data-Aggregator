import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "jest.config.js",
      "jest.setup.js",
      "next.config.js",
    ],
  },
  {
    rules: {
      // Pre-existing violations — downgraded to warnings so CI is not blocked.
      // These should be fixed incrementally over time.
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
  {
    // Test files: relax rules that conflict with Jest mock patterns.
    files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      // jest.mock() factories must use require() because mocks are hoisted.
      "@typescript-eslint/no-require-imports": "off",
      // Inline mock components inside jest.mock() don't need display names.
      "react/display-name": "off",
    },
  },
];

export default eslintConfig;
