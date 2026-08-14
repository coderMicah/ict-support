import { createFileRoute } from "@tanstack/react-router";

import { ContactManagement } from "#/components/contacts/contact-management";
import { can } from "#/lib/access-control";
import { getContacts } from "#/server/contacts";

export const Route = createFileRoute("/(protected)/contacts/manage")({
	loader: async ({ context }) => ({
		contacts: await getContacts(),
		user: context.user,
	}),
	component: ManageContactsPage,
});

function ManageContactsPage() {
	const { contacts, user } = Route.useLoaderData();

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
				initialContacts={contacts}
				canCreate={can(user.role, { contacts: ["create"] })}
				canUpdate={can(user.role, { contacts: ["update"] })}
				canDelete={can(user.role, { contacts: ["delete"] })}
			/>
		</div>
	);
}
