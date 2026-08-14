import { customType } from "drizzle-orm/pg-core";

/**
 * Postgres `tsvector` column type for full-text search.
 *
 * Values are produced by generated columns (see the `searchVector` columns on
 * `articles`, `documents`, and `contacts`) and matched with the `@@` operator
 * in search queries.
 */
export const tsvector = customType<{ data: string; driverData: string }>({
	dataType() {
		return "tsvector";
	},
});
