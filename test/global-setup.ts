import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import { testDatabaseName, testDatabaseUrl } from "./env.ts";

export default async function globalSetup(): Promise<void> {
	const maintenanceUrl = testDatabaseUrl.replace(/\/[^/]+$/, "/postgres");
	const maintenance = new Pool({ connectionString: maintenanceUrl });

	try {
		const existing = await maintenance.query(
			"SELECT 1 FROM pg_database WHERE datname = $1",
			[testDatabaseName],
		);

		if (existing.rowCount === 0) {
			await maintenance.query(`CREATE DATABASE "${testDatabaseName}"`);
		}
	} finally {
		await maintenance.end();
	}

	const pool = new Pool({ connectionString: testDatabaseUrl });
	const db = drizzle(pool);

	try {
		await migrate(db, { migrationsFolder: "./drizzle" });
	} finally {
		await pool.end();
	}
}
