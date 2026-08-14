import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
	id: serial("id").primaryKey(),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	description: text("description"),
	sortOrder: integer("sort_order").notNull().default(0),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
