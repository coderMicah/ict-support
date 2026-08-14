import { asc, eq } from "drizzle-orm";

import { db } from "#/db";
import { contacts } from "#/db/schema";
import { AppError } from "#/lib/errors";
import { type ContactInput, contactInputSchema } from "#/lib/schemas/contacts";

export type ContactItem = {
	id: number;
	name: string;
	role: string;
	phone: string | null;
	email: string | null;
	coverage: string | null;
	sortOrder: number;
	active: boolean;
	createdAt: string;
	updatedAt: string;
};

type ContactRow = {
	id: number;
	name: string;
	role: string;
	phone: string | null;
	email: string | null;
	coverage: string | null;
	sortOrder: number;
	active: boolean;
	createdAt: Date;
	updatedAt: Date;
};

function toContactItem(row: ContactRow): ContactItem {
	return {
		id: row.id,
		name: row.name,
		role: row.role,
		phone: row.phone,
		email: row.email,
		coverage: row.coverage,
		sortOrder: row.sortOrder,
		active: row.active,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

function toValues(input: ContactInput) {
	return {
		name: input.name,
		role: input.role,
		phone: input.phone ? input.phone : null,
		email: input.email ? input.email : null,
		coverage: input.coverage ? input.coverage : null,
		sortOrder: input.sortOrder,
		active: input.active,
	};
}

export async function listContactsAction(): Promise<ContactItem[]> {
	const rows = await db
		.select()
		.from(contacts)
		.orderBy(asc(contacts.sortOrder), asc(contacts.name));

	return rows.map(toContactItem);
}

export async function listActiveContactsAction(): Promise<ContactItem[]> {
	const rows = await db
		.select()
		.from(contacts)
		.where(eq(contacts.active, true))
		.orderBy(asc(contacts.sortOrder), asc(contacts.name));

	return rows.map(toContactItem);
}

export async function getContactAction(id: number): Promise<ContactItem> {
	const [row] = await db.select().from(contacts).where(eq(contacts.id, id));

	if (!row) {
		throw new AppError("Contact not found.", "NOT_FOUND", 404);
	}

	return toContactItem(row);
}

export async function createContactAction(
	input: unknown,
): Promise<ContactItem> {
	const data = contactInputSchema.parse(input);

	const [row] = await db.insert(contacts).values(toValues(data)).returning();

	return toContactItem(row);
}

export async function updateContactAction(
	id: number,
	input: unknown,
): Promise<ContactItem> {
	const data = contactInputSchema.parse(input);

	const [row] = await db
		.update(contacts)
		.set(toValues(data))
		.where(eq(contacts.id, id))
		.returning();

	if (!row) {
		throw new AppError("Contact not found.", "NOT_FOUND", 404);
	}

	return toContactItem(row);
}

export async function deleteContactAction(id: number): Promise<void> {
	const [row] = await db
		.delete(contacts)
		.where(eq(contacts.id, id))
		.returning({ id: contacts.id });

	if (!row) {
		throw new AppError("Contact not found.", "NOT_FOUND", 404);
	}
}
