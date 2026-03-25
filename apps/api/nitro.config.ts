import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  modules: ["workflow/nitro"],
  alias: {
    "@api": resolve("src"),
  },
  vercel: {
    functions: {
      maxDuration: 800,
    },
    config: {
      version: 3,
      crons: [],
    },
  },
  rollupConfig: {
    plugins: [
      {
        // Inlines .txt file contents as ES module default exports at build time.
        // Uses the \0 virtual module prefix (Rollup convention) to prevent Nitro's
        // built-in asset handler from intercepting .txt imports and returning file
        // paths instead of content.
        name: "txt-import",
        async resolveId(source: string, importer: string | undefined) {
          if (!source.endsWith(".txt") || !importer) return null;
          const resolved = await this.resolve(source, importer, {
            skipSelf: true,
          });
          if (!resolved) return null;
          return `\0txt:${resolved.id}`;
        },
        load(id: string) {
          if (id.startsWith("\0txt:")) {
            const filePath = id.slice("\0txt:".length);
            this.addWatchFile(filePath);
            const content = readFileSync(filePath, "utf-8").trimEnd();
            return {
              code: `export default ${JSON.stringify(content)};`,
              map: null,
            };
          }
        },
      },
    ],
  },
  handlers: [
    {
      route: "/**",
      handler: "./src/index.ts",
    },
  ],
  watchOptions: {
    ignored: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.turbo/**",
      "**/supabase/**",
      "**/.git/**",
      "**/.output/**",
      "**/.nitro/**",
      "**/.swc/**",
    ],
    usePolling: false,
  },
});
