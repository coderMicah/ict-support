import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { CategoryItem } from "#/lib/categories";
import type { DocumentItem } from "#/lib/documents";
import { getErrorMessage } from "#/lib/errors";
import {
	type DocumentInput,
	documentInputSchema,
} from "#/lib/schemas/documents";
import { updateDocument, uploadDocument } from "#/server/documents";

type DocumentFormProps = {
	mode: "create" | "edit";
	initial?: DocumentItem;
	categories: CategoryItem[];
};

const inputClass =
	"w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none";

function readFileAsBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result;
			if (typeof result === "string") {
				resolve(result.split(",")[1] ?? "");
			} else {
				reject(new Error("Could not read the selected file."));
			}
		};
		reader.onerror = () =>
			reject(new Error("Could not read the selected file."));
		reader.readAsDataURL(file);
	});
}

export function DocumentForm({ mode, initial, categories }: DocumentFormProps) {
	const navigate = useNavigate();
	const [submitting, setSubmitting] = useState(false);
	const fileRef = useRef<HTMLInputElement>(null);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<DocumentInput>({
		resolver: zodResolver(documentInputSchema),
		defaultValues: {
			title: initial?.title ?? "",
			categoryId: initial?.categoryId ?? null,
		},
	});

	const onSubmit = async (values: DocumentInput) => {
		setSubmitting(true);
		try {
			if (mode === "edit" && initial) {
				await updateDocument({ data: { ...values, id: initial.id } });
				toast.success("Document updated.");
			} else {
				const file = fileRef.current?.files?.[0];
				if (!file) {
					toast.error("A file must be selected.");
					return;
				}
				const data = await readFileAsBase64(file);
				await uploadDocument({
					data: { ...values, filename: file.name, data },
				});
				toast.success("Document uploaded and pending approval.");
			}
			await navigate({ to: "/documents" });
		} catch (error) {
			toast.error(getErrorMessage(error));
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="space-y-5 rounded-lg border border-neutral-200 bg-white p-5"
		>
			<label className="block">
				<span className="mb-1 block text-sm font-medium text-neutral-700">
					Title
				</span>
				<input {...register("title")} className={inputClass} />
				{errors.title && (
					<span className="mt-1 block text-xs text-red-600">
						{errors.title.message}
					</span>
				)}
			</label>

			<label className="block">
				<span className="mb-1 block text-sm font-medium text-neutral-700">
					Category{" "}
					<span className="font-normal text-neutral-400">(optional)</span>
				</span>
				<select
					{...register("categoryId", {
						valueAsNumber: true,
						setValueAs: (value) => (value === "" ? null : Number(value)),
					})}
					className={inputClass}
				>
					<option value="">None</option>
					{categories.map((category) => (
						<option key={category.id} value={category.id}>
							{category.name}
						</option>
					))}
				</select>
				{errors.categoryId && (
					<span className="mt-1 block text-xs text-red-600">
						{errors.categoryId.message}
					</span>
				)}
			</label>

			{mode === "create" && (
				<label className="block">
					<span className="mb-1 block text-sm font-medium text-neutral-700">
						File
					</span>
					<input
						ref={fileRef}
						type="file"
						accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp"
						className={inputClass}
					/>
					<span className="mt-1 block text-xs text-neutral-400">
						Office documents and PDFs up to 20 MB.
					</span>
				</label>
			)}

			{mode === "edit" && initial && (
				<p className="text-sm text-neutral-500">
					File: <span className="font-medium">{initial.originalName}</span> (
					{(initial.size / (1024 * 1024)).toFixed(1)} MB)
				</p>
			)}

			<div className="flex items-center gap-2">
				<button
					type="submit"
					disabled={submitting}
					className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{submitting
						? "Saving…"
						: mode === "edit"
							? "Save changes"
							: "Upload document"}
				</button>
				<button
					type="button"
					onClick={() => navigate({ to: "/documents" })}
					className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-neutral-100"
				>
					Cancel
				</button>
			</div>
		</form>
	);
}
