import { createRequire } from "node:module";
import { defineConfig } from "vitest/config";

const require = createRequire(import.meta.url);

const reactEntry = require.resolve("react");
const reactJsxRuntimeEntry = require.resolve("react/jsx-runtime");
const reactJsxDevRuntimeEntry = require.resolve("react/jsx-dev-runtime");
const reactDomEntry = require.resolve("react-dom");
const reactDomClientEntry = require.resolve("react-dom/client");
const reactDomServerEntry = require.resolve("react-dom/server");
const reactDomTestUtilsEntry = require.resolve("react-dom/test-utils");

export default defineConfig({
  resolve: {
    alias: [
      { find: /^react$/, replacement: reactEntry },
      { find: /^react\/jsx-runtime$/, replacement: reactJsxRuntimeEntry },
      { find: /^react\/jsx-dev-runtime$/, replacement: reactJsxDevRuntimeEntry },
      { find: /^react-dom$/, replacement: reactDomEntry },
      { find: /^react-dom\/client$/, replacement: reactDomClientEntry },
      { find: /^react-dom\/server$/, replacement: reactDomServerEntry },
      { find: /^react-dom\/test-utils$/, replacement: reactDomTestUtilsEntry }
    ]
  },
  test: {
    environment: "jsdom",
    globals: true
  }
});
