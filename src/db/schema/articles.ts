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

export const articles = pgTable(
	"articles",
	{
		id: serial("id").primaryKey(),
		title: text("title").notNull(),
		slug: text("slug").notNull().unique(),
		excerpt: text("excerpt"),
		body: jsonb("body").notNull(),
		state: text("state").notNull().default("draft"),
		categoryId: integer("category_id")
			.notNull()
			.references(() => categories.id),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
		deletedAt: timestamp("deleted_at"),
	},
	(table) => [index("articles_category_id_idx").on(table.categoryId)],
);
