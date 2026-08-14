import {
	boolean,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const contacts = pgTable("contacts", {
	id: serial("id").primaryKey(),
	name: text("name").notNull(),
	role: text("role").notNull(),
	phone: text("phone"),
	email: text("email"),
	coverage: text("coverage"),
	sortOrder: integer("sort_order").notNull().default(0),
	active: boolean("active").notNull().default(true),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
