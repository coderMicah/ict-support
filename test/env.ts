import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

const baseUrl = process.env.DATABASE_URL;

if (!baseUrl) {
	throw new Error(
		"DATABASE_URL is not set. Create .env.local (see .env.example).",
	);
}

export const testDatabaseName = "ict_support_test";
export const testDatabaseUrl = baseUrl.replace(/\/[^/]+$/, `/${testDatabaseName}`);
