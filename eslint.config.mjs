import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "coverage/**",
      "supabase/.branches/**",
      "supabase/.temp/**",
      // Proyecto independiente (Vite) con su propio tooling: ver docs/decisions/0008.
      "instagram-reimagined/**",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    // CLI scripts print progress/instructions to stdout by design.
    files: ["scripts/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
];

export default eslintConfig;
