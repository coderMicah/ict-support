import { sql } from "drizzle-orm";
import {
	index,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

import { categories } from "./categories";
import { tsvector } from "./tsvector";

export const articles = pgTable(
	"articles",
	{
		id: serial("id").primaryKey(),
		title: text("title").notNull(),
		slug: text("slug").notNull().unique(),
		excerpt: text("excerpt"),
		body: jsonb("body").notNull(),
		plainText: text("plain_text").notNull().default(""),
		searchVector: tsvector("search_vector").generatedAlwaysAs(
			sql`to_tsvector('english', ${sql.raw("title")} || ' ' || coalesce(${sql.raw("excerpt")}, '') || ' ' || ${sql.raw("plain_text")})`,
		),
		state: text("state").notNull().default("draft"),
		categoryId: integer("category_id")
			.notNull()
			.references(() => categories.id),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
		deletedAt: timestamp("deleted_at"),
	},
	(table) => [
		index("articles_category_id_idx").on(table.categoryId),
		index("articles_search_idx").using("gin", table.searchVector),
	],
);
