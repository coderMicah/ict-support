import { z } from "zod";

import { isValidLexicalState } from "#/lib/lexical";

import { slugRegex } from "./categories";

export const articleInputSchema = z.object({
	title: z
		.string()
		.trim()
		.min(1, "Title is required.")
		.max(200, "Title must be at most 200 characters."),
	slug: z
		.string()
		.trim()
		.min(1, "Slug is required.")
		.max(200, "Slug must be at most 200 characters.")
		.regex(
			slugRegex,
			"Slug must contain only lowercase letters, numbers, and hyphens.",
		),
	categoryId: z
		.number()
		.int("Please choose a category.")
		.positive("Please choose a category."),
	excerpt: z
		.string()
		.trim()
		.max(500, "Excerpt must be at most 500 characters.")
		.optional(),
	body: z
		.string()
		.refine(isValidLexicalState, "Body contains invalid editor content.")
		.optional(),
});

export const articleIdSchema = z.object({
	id: z.number().int("Invalid article id.").positive("Invalid article id."),
});

export const articleUpdateSchema = articleInputSchema.extend(
	articleIdSchema.shape,
);

export type ArticleInput = z.infer<typeof articleInputSchema>;
