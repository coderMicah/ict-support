import { sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

import { tsvector } from "./tsvector";

export const contacts = pgTable(
	"contacts",
	{
		id: serial("id").primaryKey(),
		name: text("name").notNull(),
		role: text("role").notNull(),
		phone: text("phone"),
		email: text("email"),
		coverage: text("coverage"),
		sortOrder: integer("sort_order").notNull().default(0),
		active: boolean("active").notNull().default(true),
		searchVector: tsvector("search_vector").generatedAlwaysAs(
			sql`to_tsvector('english', ${sql.raw("name")} || ' ' || ${sql.raw("role")} || ' ' || coalesce(${sql.raw("phone")}, '') || ' ' || coalesce(${sql.raw("email")}, '') || ' ' || coalesce(${sql.raw("coverage")}, ''))`,
		),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [index("contacts_search_idx").using("gin", table.searchVector)],
);
