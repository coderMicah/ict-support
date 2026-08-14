import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { ContactItem } from "#/lib/contacts";
import { getErrorMessage } from "#/lib/errors";
import { type ContactInput, contactInputSchema } from "#/lib/schemas/contacts";
import { createContact, deleteContact, updateContact } from "#/server/contacts";

type ContactManagementProps = {
	initialContacts: ContactItem[];
	canCreate: boolean;
	canUpdate: boolean;
	canDelete: boolean;
};

const bySortOrder = (a: ContactItem, b: ContactItem) =>
	a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);

const emptyValues: ContactInput = {
	name: "",
	role: "",
	phone: "",
	email: "",
	coverage: "",
	sortOrder: 0,
	active: true,
};

export function ContactManagement({
	initialContacts,
	canCreate,
	canUpdate,
	canDelete,
}: ContactManagementProps) {
	const [contacts, setContacts] = useState(initialContacts);
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<ContactItem | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [busyId, setBusyId] = useState<number | null>(null);
	const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<ContactInput>({
		resolver: zodResolver(contactInputSchema),
		defaultValues: emptyValues,
	});

	const openCreateForm = () => {
		setEditing(null);
		reset(emptyValues);
		setFormOpen(true);
	};

	const openEditForm = (contact: ContactItem) => {
		setEditing(contact);
		reset({
			name: contact.name,
			role: contact.role,
			phone: contact.phone ?? "",
			email: contact.email ?? "",
			coverage: contact.coverage ?? "",
			sortOrder: contact.sortOrder,
			active: contact.active,
		});
		setFormOpen(true);
	};

	const closeForm = () => {
		setFormOpen(false);
		setEditing(null);
		reset(emptyValues);
	};

	const onSubmit = async (values: ContactInput) => {
		setSubmitting(true);
		try {
			if (editing) {
				const updated = await updateContact({
					data: { ...values, id: editing.id },
				});
				setContacts((prev) =>
					prev
						.map((row) => (row.id === updated.id ? updated : row))
						.sort(bySortOrder),
				);
				toast.success("Contact updated.");
			} else {
				const created = await createContact({ data: values });
				setContacts((prev) => [...prev, created].sort(bySortOrder));
				toast.success("Contact created.");
			}
			closeForm();
		} catch (error) {
			toast.error(getErrorMessage(error));
		} finally {
			setSubmitting(false);
		}
	};

	const onDelete = async (id: number) => {
		if (busyId) {
			return;
		}

		setBusyId(id);
		try {
			await deleteContact({ data: { id } });
			setContacts((prev) => prev.filter((row) => row.id !== id));
			setConfirmDeleteId(null);
			toast.success("Contact deleted.");
		} catch (error) {
			toast.error(getErrorMessage(error));
			setConfirmDeleteId(null);
		} finally {
			setBusyId(null);
		}
	};

	const inputClass =
		"w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none";

	return (
		<div className="space-y-4">
			{canCreate && (
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold tracking-tight">Contacts</h2>
					<button
						type="button"
						onClick={openCreateForm}
						className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
					>
						<Plus className="size-4" />
						New contact
					</button>
				</div>
			)}

			<Dialog open={formOpen} onClose={closeForm} className="relative z-50">
				<DialogBackdrop className="fixed inset-0 bg-neutral-900/40" />

				<div className="fixed inset-0 overflow-y-auto">
					<div className="flex min-h-full items-center justify-center p-4">
						<DialogPanel className="w-full max-w-lg rounded-xl bg-white shadow-xl">
							<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
								<div className="flex items-center justify-between">
									<DialogTitle className="text-sm font-semibold">
										{editing ? "Edit contact" : "New contact"}
									</DialogTitle>
									<button
										type="button"
										onClick={closeForm}
										className="rounded-md p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
									>
										<X className="size-4" />
									</button>
								</div>

								<div className="grid gap-4 sm:grid-cols-2">
									<label className="block">
										<span className="mb-1 block text-sm font-medium text-neutral-700">
											Name
										</span>
										<input
											{...register("name")}
											className={inputClass}
											placeholder="Jane Doe"
										/>
										{errors.name && (
											<span className="mt-1 block text-xs text-red-600">
												{errors.name.message}
											</span>
										)}
									</label>

									<label className="block">
										<span className="mb-1 block text-sm font-medium text-neutral-700">
											Role / title
										</span>
										<input
											{...register("role")}
											className={inputClass}
											placeholder="ICT Officer"
										/>
										{errors.role && (
											<span className="mt-1 block text-xs text-red-600">
												{errors.role.message}
											</span>
										)}
									</label>

									<label className="block">
										<span className="mb-1 block text-sm font-medium text-neutral-700">
											Phone
										</span>
										<input
											{...register("phone")}
											className={inputClass}
											placeholder="+27 12 345 6789"
										/>
										{errors.phone && (
											<span className="mt-1 block text-xs text-red-600">
												{errors.phone.message}
											</span>
										)}
									</label>

									<label className="block">
										<span className="mb-1 block text-sm font-medium text-neutral-700">
											Email
										</span>
										<input
											type="email"
											{...register("email")}
											className={inputClass}
											placeholder="jane.doe@example.gov"
										/>
										{errors.email && (
											<span className="mt-1 block text-xs text-red-600">
												{errors.email.message}
											</span>
										)}
									</label>
								</div>

								<label className="block">
									<span className="mb-1 block text-sm font-medium text-neutral-700">
										Coverage{" "}
										<span className="font-normal text-neutral-400">
											(optional)
										</span>
									</span>
									<textarea
										{...register("coverage")}
										rows={2}
										className={inputClass}
										placeholder="Covers the head office, weekdays 8am–5pm."
									/>
									{errors.coverage && (
										<span className="mt-1 block text-xs text-red-600">
											{errors.coverage.message}
										</span>
									)}
								</label>

								<div className="grid gap-4 sm:grid-cols-2">
									<label className="block sm:w-40">
										<span className="mb-1 block text-sm font-medium text-neutral-700">
											Sort order
										</span>
										<input
											type="number"
											{...register("sortOrder", { valueAsNumber: true })}
											className={inputClass}
										/>
										{errors.sortOrder && (
											<span className="mt-1 block text-xs text-red-600">
												{errors.sortOrder.message}
											</span>
										)}
									</label>

									<label className="flex items-center gap-2 pt-6">
										<input
											type="checkbox"
											{...register("active")}
											className="size-4 rounded border-neutral-300"
										/>
										<span className="text-sm font-medium text-neutral-700">
											Active (visible on the public contacts page)
										</span>
									</label>
								</div>

								<div className="flex items-center gap-2">
									<button
										type="submit"
										disabled={submitting}
										className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{submitting
											? "Saving…"
											: editing
												? "Save changes"
												: "Create contact"}
									</button>
									<button
										type="button"
										onClick={closeForm}
										className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-neutral-100"
									>
										Cancel
									</button>
								</div>
							</form>
						</DialogPanel>
					</div>
				</div>
			</Dialog>

			<div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
				<table className="w-full min-w-[720px] text-sm">
					<thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wider text-neutral-500">
						<tr>
							<th className="px-4 py-3 font-medium">Name</th>
							<th className="px-4 py-3 font-medium">Role</th>
							<th className="px-4 py-3 font-medium">Contact</th>
							<th className="px-4 py-3 font-medium">Coverage</th>
							<th className="px-4 py-3 font-medium">Sort</th>
							<th className="px-4 py-3 font-medium">Status</th>
							<th className="px-4 py-3 font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{contacts.length === 0 && (
							<tr>
								<td
									colSpan={7}
									className="px-4 py-8 text-center text-neutral-500"
								>
									No contacts yet. Create one to get started.
								</td>
							</tr>
						)}
						{contacts.map((row) => (
							<tr
								key={row.id}
								className="border-b border-neutral-200 last:border-0"
							>
								<td className="px-4 py-3 font-medium">{row.name}</td>
								<td className="px-4 py-3 text-neutral-500">{row.role}</td>
								<td className="px-4 py-3 text-neutral-500">
									{row.phone && <div>{row.phone}</div>}
									{row.email && <div>{row.email}</div>}
									{!row.phone && !row.email && <span>—</span>}
								</td>
								<td className="max-w-xs truncate px-4 py-3 text-neutral-500">
									{row.coverage || "—"}
								</td>
								<td className="px-4 py-3 text-neutral-500">{row.sortOrder}</td>
								<td className="px-4 py-3">
									<span
										className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
											row.active
												? "bg-green-100 text-green-700"
												: "bg-neutral-100 text-neutral-500"
										}`}
									>
										{row.active ? "Active" : "Inactive"}
									</span>
								</td>
								<td className="px-4 py-3">
									{confirmDeleteId === row.id ? (
										<div className="flex items-center gap-2">
											<span className="text-xs text-neutral-500">Delete?</span>
											<button
												type="button"
												disabled={busyId === row.id}
												onClick={() => onDelete(row.id)}
												className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-60"
											>
												{busyId === row.id ? "Deleting…" : "Delete"}
											</button>
											<button
												type="button"
												disabled={busyId === row.id}
												onClick={() => setConfirmDeleteId(null)}
												className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium transition-colors hover:bg-neutral-100"
											>
												Cancel
											</button>
										</div>
									) : (
										<div className="flex items-center gap-2">
											{canUpdate && (
												<button
													type="button"
													onClick={() => openEditForm(row)}
													className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-sm font-medium transition-colors hover:bg-neutral-100"
												>
													<Pencil className="size-3.5" />
													Edit
												</button>
											)}
											{canDelete && (
												<button
													type="button"
													onClick={() => setConfirmDeleteId(row.id)}
													className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
												>
													<Trash2 className="size-3.5" />
													Delete
												</button>
											)}
										</div>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
