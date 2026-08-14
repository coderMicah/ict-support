import { z } from "zod";

export const imageUploadSchema = z.object({
	filename: z
		.string()
		.trim()
		.min(1, "A file must be selected.")
		.max(255, "Filename must be at most 255 characters."),
	data: z.string().min(1, "No file data provided."),
});

export type ImageUploadInput = z.infer<typeof imageUploadSchema>;
