import { z } from "zod";

export const contactInputSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required.")
		.max(100, "Name must be at most 100 characters."),
	role: z
		.string()
		.trim()
		.min(1, "Role is required.")
		.max(100, "Role must be at most 100 characters."),
	phone: z
		.string()
		.trim()
		.max(50, "Phone must be at most 50 characters.")
		.optional(),
	email: z
		.string()
		.trim()
		.max(200, "Email must be at most 200 characters.")
		.optional(),
	coverage: z
		.string()
		.trim()
		.max(500, "Coverage must be at most 500 characters.")
		.optional(),
	sortOrder: z
		.number()
		.int("Sort order must be a whole number.")
		.min(0, "Sort order must be 0 or greater.")
		.max(9999, "Sort order must be at most 9999."),
	active: z.boolean(),
});

export const contactIdSchema = z.object({
	id: z.number().int("Invalid contact id.").positive("Invalid contact id."),
});

export const contactUpdateSchema = contactInputSchema.extend(
	contactIdSchema.shape,
);

export type ContactInput = z.infer<typeof contactInputSchema>;
