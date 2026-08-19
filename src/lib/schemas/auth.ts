import { z } from "zod";

export const signInSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "Email is required.")
		.email("Please enter a valid email address."),
	password: z
		.string()
		.min(1, "Password is required.")
		.min(8, "Password must be at least 8 characters."),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required.")
		.max(100, "Name must be at most 100 characters."),
	email: z
		.string()
		.trim()
		.min(1, "Email is required.")
		.email("Please enter a valid email address."),
	password: z
		.string()
		.min(1, "Password is required.")
		.min(8, "Password must be at least 8 characters.")
		.regex(/[A-Z]/, "Password must contain an uppercase letter.")
		.regex(/[0-9]/, "Password must contain a number."),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
