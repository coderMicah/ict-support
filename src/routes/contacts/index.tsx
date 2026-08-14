import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone } from "lucide-react";

import { getPublicContacts } from "#/server/public";

export const Route = createFileRoute("/contacts/")({
	loader: () => getPublicContacts(),
	head: () => ({
		meta: [
			{
				title: "Contacts · ICT Support",
			},
			{
				name: "description",
				content:
					"Contact details for the ICT department, including phone, email, and coverage notes.",
			},
		],
	}),
	component: ContactsPage,
});

function ContactsPage() {
	const contacts = Route.useLoaderData();

	return (
		<div className="space-y-8">
			<header>
				<h1 className="text-3xl font-bold tracking-tight">ICT Contacts</h1>
				<p className="mt-2 text-neutral-600">
					Who to contact for ICT support, along with how to reach them.
				</p>
			</header>

			{contacts.length === 0 ? (
				<p className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
					No contacts published yet. Check back soon.
				</p>
			) : (
				<div className="grid gap-4 sm:grid-cols-2">
					{contacts.map((contact) => (
						<div
							key={contact.id}
							className="flex flex-col rounded-lg border border-neutral-200 bg-white p-5"
						>
							<h2 className="text-base font-semibold tracking-tight">
								{contact.name}
							</h2>
							<p className="mt-0.5 text-sm text-neutral-500">{contact.role}</p>

							<div className="mt-4 space-y-1.5 text-sm">
								{contact.phone && (
									<p className="flex items-center gap-2 text-neutral-700">
										<Phone className="size-4 shrink-0 text-neutral-400" />
										{contact.phone}
									</p>
								)}
								{contact.email && (
									<p className="flex items-center gap-2 text-neutral-700">
										<Mail className="size-4 shrink-0 text-neutral-400" />
										{contact.email}
									</p>
								)}
							</div>

							{contact.coverage && (
								<p className="mt-4 border-t border-neutral-100 pt-3 text-sm text-neutral-500">
									{contact.coverage}
								</p>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
