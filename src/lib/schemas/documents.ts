import { z } from "zod";

const titleField = z
	.string()
	.trim()
	.min(1, "Title is required.")
	.max(200, "Title must be at most 200 characters.");

const categoryIdField = z
	.number()
	.int("Invalid category.")
	.positive("Invalid category.")
	.nullable()
	.optional();

const fileFields = {
	filename: z
		.string()
		.trim()
		.min(1, "A file must be selected.")
		.max(255, "Filename must be at most 255 characters."),
	data: z.string().min(1, "No file data provided."),
} as const;

export const documentInputSchema = z.object({
	title: titleField,
	categoryId: categoryIdField,
});

export const documentUploadSchema = documentInputSchema.extend(fileFields);

export const documentIdSchema = z.object({
	id: z.number().int("Invalid document id.").positive("Invalid document id."),
});

export const documentUpdateSchema = documentInputSchema.extend(
	documentIdSchema.shape,
);

export type DocumentInput = z.infer<typeof documentInputSchema>;
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;
