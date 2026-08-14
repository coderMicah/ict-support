import path from "node:path";

import { defineConfig } from "vitest/config";

import { testDatabaseUrl } from "./test/env.ts";

export default defineConfig({
	resolve: {
		alias: {
			"#": path.resolve(process.cwd(), "src"),
			"@": path.resolve(process.cwd(), "src"),
		},
	},
	test: {
		env: {
			DATABASE_URL: testDatabaseUrl,
		},
		globalSetup: "./test/global-setup.ts",
		environment: "node",
		fileParallelism: false,
	},
});
