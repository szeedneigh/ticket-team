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
    ],
  },
  {
    rules: {
      // Prevent importing the deprecated unified env module
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/env",
              message:
                "DEPRECATED: @/lib/env has been split for security. " +
                "Use '@/lib/env/client' for client components or '@/lib/env/server' for server components.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
