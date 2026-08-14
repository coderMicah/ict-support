import {
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

import { categories } from "./categories";

export const documents = pgTable(
	"documents",
	{
		id: serial("id").primaryKey(),
		title: text("title").notNull(),
		fileKey: text("file_key").notNull().unique(),
		originalName: text("original_name").notNull(),
		contentType: text("content_type").notNull(),
		size: integer("size").notNull(),
		state: text("state").notNull().default("pending"),
		categoryId: integer("category_id").references(() => categories.id),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
		deletedAt: timestamp("deleted_at"),
	},
	(table) => [index("documents_category_id_idx").on(table.categoryId)],
);
