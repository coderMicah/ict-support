import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { RichTextEditor } from "#/components/editor/rich-text-editor";
import type { ArticleItem } from "#/lib/articles";
import type { CategoryItem } from "#/lib/categories";
import { getErrorMessage } from "#/lib/errors";
import { emptyLexicalStateString } from "#/lib/lexical";
import { type ArticleInput, articleInputSchema } from "#/lib/schemas/articles";
import { slugify } from "#/lib/schemas/categories";
import { inputClass } from "#/lib/utils";
import { createArticle, updateArticle } from "#/server/articles";

const excerptLength = 160;

type ArticleFormProps = {
	mode: "create" | "edit";
	initial?: ArticleItem;
	categories: CategoryItem[];
};

export function ArticleForm({ mode, initial, categories }: ArticleFormProps) {
	const navigate = useNavigate();
	const [submitting, setSubmitting] = useState(false);
	const excerptTouched = useRef(false);

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors, touchedFields },
	} = useForm<ArticleInput>({
		resolver: zodResolver(articleInputSchema),
		defaultValues: {
			title: initial?.title ?? "",
			slug: initial?.slug ?? "",
			categoryId: initial?.categoryId ?? categories[0]?.id,
			excerpt: initial?.excerpt ?? "",
			body: initial?.body ?? emptyLexicalStateString,
		},
	});

	if (categories.length === 0) {
		return (
			<div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
				<p className="text-sm text-neutral-500">
					You need at least one category before creating articles.
				</p>
			</div>
		);
	}

	const onBodyChange = (bodyJson: string, plainText: string) => {
		setValue("body", bodyJson, { shouldValidate: true });

		if (!excerptTouched.current) {
			setValue("excerpt", plainText.slice(0, excerptLength), {
				shouldValidate: false,
			});
		}
	};

	const onSubmit = async (values: ArticleInput) => {
		setSubmitting(true);
		try {
			if (mode === "edit" && initial) {
				await updateArticle({ data: { ...values, id: initial.id } });
				toast.success("Article updated.");
			} else {
				await createArticle({ data: values });
				toast.success("Article created.");
			}
			await navigate({ to: "/articles" });
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
			<div className="grid gap-4 sm:grid-cols-2">
				<label className="block sm:col-span-2">
					<span className="mb-1 block text-sm font-medium text-neutral-700">
						Title
					</span>
					<input
						{...register("title")}
						onChange={(event) => {
							setValue("title", event.target.value);
							if (mode === "create" && !touchedFields.slug) {
								setValue("slug", slugify(event.target.value), {
									shouldValidate: false,
								});
							}
						}}
						className={inputClass}
					/>
					{errors.title && (
						<span className="mt-1 block text-xs text-red-600">
							{errors.title.message}
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
						placeholder="printer-configuration-guide"
					/>
					{errors.slug && (
						<span className="mt-1 block text-xs text-red-600">
							{errors.slug.message}
						</span>
					)}
				</label>

				<label className="block">
					<span className="mb-1 block text-sm font-medium text-neutral-700">
						Category
					</span>
					<select
						{...register("categoryId", { valueAsNumber: true })}
						className={inputClass}
					>
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
			</div>

			<label className="block">
				<span className="mb-1 block text-sm font-medium text-neutral-700">
					Excerpt{" "}
					<span className="font-normal text-neutral-400">
						(auto-suggested from the body)
					</span>
				</span>
				<textarea
					{...register("excerpt")}
					onChange={(event) => {
						excerptTouched.current = true;
						setValue("excerpt", event.target.value);
					}}
					rows={2}
					className={inputClass}
				/>
				{errors.excerpt && (
					<span className="mt-1 block text-xs text-red-600">
						{errors.excerpt.message}
					</span>
				)}
			</label>

			<div>
				<span className="mb-1 block text-sm font-medium text-neutral-700">
					Body
				</span>
				<RichTextEditor
					key={initial?.id ?? "new"}
					initialBody={initial?.body ?? ""}
					onChange={onBodyChange}
				/>
				{errors.body && (
					<span className="mt-1 block text-xs text-red-600">
						{errors.body.message}
					</span>
				)}
			</div>

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
							: "Create article"}
				</button>
				<button
					type="button"
					onClick={() => navigate({ to: "/articles" })}
					className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-neutral-100"
				>
					Cancel
				</button>
			</div>
		</form>
	);
}
