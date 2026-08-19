import { createServerFn } from "@tanstack/react-start";

import type { ContactItem } from "#/lib/contacts";
import {
	contactIdSchema,
	contactInputSchema,
	contactUpdateSchema,
} from "#/lib/schemas/contacts";

export const getContacts = createServerFn({
	method: "GET",
}).handler(async (): Promise<ContactItem[]> => {
	const { requirePermission } = await import("./guard");
	const { listContactsAction } = await import("#/lib/contacts");

	await requirePermission({ contacts: ["view"] });

	return listContactsAction();
});

export const createContact = createServerFn({
	method: "POST",
})
	.validator(contactInputSchema)
	.handler(async ({ data }): Promise<ContactItem> => {
		const { requirePermission } = await import("./guard");
		const { createContactAction } = await import("#/lib/contacts");

		await requirePermission({ contacts: ["create"] });

		return createContactAction(data);
	});

export const updateContact = createServerFn({
	method: "POST",
})
	.validator(contactUpdateSchema)
	.handler(async ({ data }): Promise<ContactItem> => {
		const { requirePermission } = await import("./guard");
		const { updateContactAction } = await import("#/lib/contacts");

		await requirePermission({ contacts: ["update"] });

		return updateContactAction(data.id, data);
	});

export const deleteContact = createServerFn({
	method: "POST",
})
	.validator(contactIdSchema)
	.handler(async ({ data }): Promise<{ ok: true }> => {
		const { requirePermission } = await import("./guard");
		const { deleteContactAction } = await import("#/lib/contacts");

		await requirePermission({ contacts: ["delete"] });

		await deleteContactAction(data.id);

		return { ok: true };
	});
