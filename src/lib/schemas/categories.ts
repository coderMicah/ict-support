import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const categoryInputSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required.")
		.max(100, "Name must be at most 100 characters."),
	slug: z
		.string()
		.trim()
		.min(1, "Slug is required.")
		.max(100, "Slug must be at most 100 characters.")
		.regex(
			slugRegex,
			"Slug must contain only lowercase letters, numbers, and hyphens.",
		),
	description: z
		.string()
		.trim()
		.max(500, "Description must be at most 500 characters.")
		.optional(),
	sortOrder: z
		.number()
		.int("Sort order must be a whole number.")
		.min(0, "Sort order must be 0 or greater.")
		.max(9999, "Sort order must be at most 9999."),
});

export const categoryIdSchema = z.object({
	id: z.number().int("Invalid category id.").positive("Invalid category id."),
});

export const categoryUpdateSchema = categoryInputSchema.extend(
	categoryIdSchema.shape,
);

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export function slugify(value: string): string {
	return value
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[^\w\s-]/g, "")
		.trim()
		.replace(/[\s_-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
