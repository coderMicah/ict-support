import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ContactManagement } from "#/components/contacts/contact-management";
import { can } from "#/lib/access-control";
import { getContacts } from "#/server/contacts";

const contactsSearchSchema = z.object({
	q: z.string().trim().max(200).optional(),
});

export const Route = createFileRoute("/(protected)/contacts/")({
	validateSearch: (search) => contactsSearchSchema.parse(search),
	loader: async ({ context }) => ({
		contacts: await getContacts(),
		user: context.user,
	}),
	component: ManageContactsPage,
});

function ManageContactsPage() {
	const { contacts, user } = Route.useLoaderData();
	const { q } = Route.useSearch();

	const filtered = q
		? contacts.filter((contact) => {
				const query = q.toLowerCase();
				return (
					contact.name.toLowerCase().includes(query) ||
					contact.role.toLowerCase().includes(query) ||
					contact.email?.toLowerCase().includes(query)
				);
			})
		: contacts;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
				<p className="mt-1 text-sm text-neutral-500">
					ICT contacts shown to staff on the public contacts page. Inactive
					contacts are never shown publicly.
				</p>
			</div>

			<ContactManagement
				initialContacts={filtered}
				canCreate={can(user.role, { contacts: ["create"] })}
				canUpdate={can(user.role, { contacts: ["update"] })}
				canDelete={can(user.role, { contacts: ["delete"] })}
			/>
		</div>
	);
}
