import { defineConfig } from "eslint/config";
import { configs } from "eslint-config-next/core-web-vitals.js";

export default defineConfig([
  ...configs,
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
]);
