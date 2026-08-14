import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "#/db";
import {
	createContactAction,
	deleteContactAction,
	listActiveContactsAction,
	listContactsAction,
	updateContactAction,
} from "#/lib/contacts";

beforeEach(async () => {
	await db.execute(sql`TRUNCATE TABLE contacts RESTART IDENTITY CASCADE`);
});

const contactInput = (overrides: Record<string, unknown> = {}) => ({
	name: "Jane Doe",
	role: "ICT Officer",
	phone: "+27 12 345 6789",
	email: "jane.doe@example.gov",
	coverage: "Head office, weekdays 8am–5pm.",
	sortOrder: 1,
	active: true,
	...overrides,
});

describe("createContactAction", () => {
	it("creates and returns a contact with all fields", async () => {
		const contact = await createContactAction(contactInput());

		expect(contact.id).toBeGreaterThan(0);
		expect(contact.name).toBe("Jane Doe");
		expect(contact.role).toBe("ICT Officer");
		expect(contact.phone).toBe("+27 12 345 6789");
		expect(contact.email).toBe("jane.doe@example.gov");
		expect(contact.coverage).toBe("Head office, weekdays 8am–5pm.");
		expect(contact.sortOrder).toBe(1);
		expect(contact.active).toBe(true);
		expect(contact.createdAt).toBeTruthy();
		expect(contact.updatedAt).toBeTruthy();
	});

	it("stores omitted optional fields as null", async () => {
		const contact = await createContactAction(
			contactInput({ phone: "", email: "", coverage: "" }),
		);

		expect(contact.phone).toBeNull();
		expect(contact.email).toBeNull();
		expect(contact.coverage).toBeNull();
	});

	it("creates an inactive contact", async () => {
		const contact = await createContactAction(
			contactInput({ active: false }),
		);

		expect(contact.active).toBe(false);
	});

	it("rejects invalid input", async () => {
		await expect(
			createContactAction(contactInput({ name: "", role: "", sortOrder: -1 })),
		).rejects.toThrow();
	});
});

describe("updateContactAction", () => {
	it("updates a contact", async () => {
		const created = await createContactAction(contactInput());

		const updated = await updateContactAction(
			created.id,
			contactInput({
				name: "John Smith",
				role: "Senior ICT Officer",
				active: false,
			}),
		);

		expect(updated.id).toBe(created.id);
		expect(updated.name).toBe("John Smith");
		expect(updated.role).toBe("Senior ICT Officer");
		expect(updated.active).toBe(false);
		expect(updated.phone).toBe(created.phone);
	});

	it("throws NOT_FOUND for a missing contact", async () => {
		await expect(
			updateContactAction(9999, contactInput()),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});
});

describe("deleteContactAction", () => {
	it("deletes a contact", async () => {
		const created = await createContactAction(contactInput());

		await deleteContactAction(created.id);

		await expect(listContactsAction()).resolves.toHaveLength(0);
	});

	it("throws NOT_FOUND for a missing contact", async () => {
		await expect(deleteContactAction(9999)).rejects.toMatchObject({
			code: "NOT_FOUND",
		});
	});
});

describe("listContactsAction", () => {
	it("returns all contacts ordered by sort order, then name", async () => {
		await createContactAction(contactInput({ name: "B", sortOrder: 2 }));
		await createContactAction(contactInput({ name: "A", sortOrder: 1 }));
		await createContactAction(contactInput({ name: "C", sortOrder: 1 }));
		await createContactAction(contactInput({ name: "Z", active: false, sortOrder: 3 }));

		const rows = await listContactsAction();

		expect(rows.map((row) => row.name)).toEqual(["A", "C", "B", "Z"]);
	});
});

describe("listActiveContactsAction", () => {
	it("returns only active contacts ordered by sort order, then name", async () => {
		await createContactAction(contactInput({ name: "B", sortOrder: 2 }));
		await createContactAction(contactInput({ name: "A", sortOrder: 1 }));
		await createContactAction(contactInput({ name: "C", sortOrder: 1 }));
		await createContactAction(contactInput({ name: "Hidden", active: false }));

		const rows = await listActiveContactsAction();

		expect(rows.map((row) => row.name)).toEqual(["A", "C", "B"]);
	});
});
