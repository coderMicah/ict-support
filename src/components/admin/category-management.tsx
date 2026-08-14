import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { CategoryItem } from "#/lib/categories";
import { getErrorMessage } from "#/lib/errors";
import {
	type CategoryInput,
	categoryInputSchema,
	slugify,
} from "#/lib/schemas/categories";
import {
	createCategory,
	deleteCategory,
	updateCategory,
} from "#/server/categories";

type CategoryManagementProps = {
	initialCategories: CategoryItem[];
};

const byDisplayOrder = (a: CategoryItem, b: CategoryItem) =>
	a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);

const emptyValues: CategoryInput = {
	name: "",
	slug: "",
	description: "",
	sortOrder: 0,
};

export function CategoryManagement({
	initialCategories,
}: CategoryManagementProps) {
	const [categories, setCategories] = useState(initialCategories);
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<CategoryItem | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [busyId, setBusyId] = useState<number | null>(null);
	const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		formState: { errors, touchedFields },
	} = useForm<CategoryInput>({
		resolver: zodResolver(categoryInputSchema),
		defaultValues: emptyValues,
	});

	const openCreateForm = () => {
		setEditing(null);
		reset(emptyValues);
		setFormOpen(true);
	};

	const openEditForm = (category: CategoryItem) => {
		setEditing(category);
		reset({
			name: category.name,
			slug: category.slug,
			description: category.description ?? "",
			sortOrder: category.sortOrder,
		});
		setFormOpen(true);
	};

	const closeForm = () => {
		setFormOpen(false);
		setEditing(null);
		reset(emptyValues);
	};

	const onSubmit = async (values: CategoryInput) => {
		setSubmitting(true);
		try {
			if (editing) {
				const updated = await updateCategory({
					data: { ...values, id: editing.id },
				});
				setCategories((prev) =>
					prev
						.map((row) => (row.id === updated.id ? updated : row))
						.sort(byDisplayOrder),
				);
				toast.success("Category updated.");
			} else {
				const created = await createCategory({ data: values });
				setCategories((prev) => [...prev, created].sort(byDisplayOrder));
				toast.success("Category created.");
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
			await deleteCategory({ data: { id } });
			setCategories((prev) => prev.filter((row) => row.id !== id));
			setConfirmDeleteId(null);
			toast.success("Category deleted.");
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
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold tracking-tight">Categories</h2>
				{!formOpen && (
					<button
						type="button"
						onClick={openCreateForm}
						className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
					>
						<Plus className="size-4" />
						New category
					</button>
				)}
			</div>

			{formOpen && (
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5"
				>
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-semibold">
							{editing ? "Edit category" : "New category"}
						</h3>
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
								onChange={(event) => {
									setValue("name", event.target.value);
									if (!touchedFields.slug) {
										setValue("slug", slugify(event.target.value), {
											shouldValidate: false,
										});
									}
								}}
								className={inputClass}
							/>
							{errors.name && (
								<span className="mt-1 block text-xs text-red-600">
									{errors.name.message}
								</span>
							)}
						</label>

						<label className="block">
							<span className="mb-1 block text-sm font-medium text-neutral-700">
								Slug
							</span>
							<input
								{...register("slug")}
								className={inputClass}
								placeholder="networking"
							/>
							{errors.slug && (
								<span className="mt-1 block text-xs text-red-600">
									{errors.slug.message}
								</span>
							)}
						</label>
					</div>

					<label className="block">
						<span className="mb-1 block text-sm font-medium text-neutral-700">
							Description
						</span>
						<textarea
							{...register("description")}
							rows={3}
							className={inputClass}
						/>
						{errors.description && (
							<span className="mt-1 block text-xs text-red-600">
								{errors.description.message}
							</span>
						)}
					</label>

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
									: "Create category"}
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
			)}

			<div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
				<table className="w-full min-w-[680px] text-sm">
					<thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wider text-neutral-500">
						<tr>
							<th className="px-4 py-3 font-medium">Name</th>
							<th className="px-4 py-3 font-medium">Slug</th>
							<th className="px-4 py-3 font-medium">Description</th>
							<th className="px-4 py-3 font-medium">Sort</th>
							<th className="px-4 py-3 font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{categories.length === 0 && (
							<tr>
								<td
									colSpan={5}
									className="px-4 py-8 text-center text-neutral-500"
								>
									No categories yet. Create one to get started.
								</td>
							</tr>
						)}
						{categories.map((row) => (
							<tr
								key={row.id}
								className="border-b border-neutral-200 last:border-0"
							>
								<td className="px-4 py-3 font-medium">{row.name}</td>
								<td className="px-4 py-3 text-neutral-500">{row.slug}</td>
								<td className="max-w-xs truncate px-4 py-3 text-neutral-500">
									{row.description || "—"}
								</td>
								<td className="px-4 py-3 text-neutral-500">{row.sortOrder}</td>
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
											<button
												type="button"
												onClick={() => openEditForm(row)}
												className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-sm font-medium transition-colors hover:bg-neutral-100"
											>
												<Pencil className="size-3.5" />
												Edit
											</button>
											<button
												type="button"
												onClick={() => setConfirmDeleteId(row.id)}
												className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
											>
												<Trash2 className="size-3.5" />
												Delete
											</button>
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
