import { createServerFn } from "@tanstack/react-start";

import {
	type ContactItem,
	createContactAction,
	deleteContactAction,
	listContactsAction,
	updateContactAction,
} from "#/lib/contacts";
import {
	contactIdSchema,
	contactInputSchema,
	contactUpdateSchema,
} from "#/lib/schemas/contacts";

import { requirePermission } from "./guard";

export const getContacts = createServerFn({
	method: "GET",
}).handler(async (): Promise<ContactItem[]> => {
	await requirePermission({ contacts: ["view"] });

	return listContactsAction();
});

export const createContact = createServerFn({
	method: "POST",
})
	.validator(contactInputSchema)
	.handler(async ({ data }): Promise<ContactItem> => {
		await requirePermission({ contacts: ["create"] });

		return createContactAction(data);
	});

export const updateContact = createServerFn({
	method: "POST",
})
	.validator(contactUpdateSchema)
	.handler(async ({ data }): Promise<ContactItem> => {
		await requirePermission({ contacts: ["update"] });

		return updateContactAction(data.id, data);
	});

export const deleteContact = createServerFn({
	method: "POST",
})
	.validator(contactIdSchema)
	.handler(async ({ data }): Promise<{ ok: true }> => {
		await requirePermission({ contacts: ["delete"] });

		await deleteContactAction(data.id);

		return { ok: true };
	});
