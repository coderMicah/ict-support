import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { auth } from "#/lib/auth";
import { signInSchema, signUpSchema } from "#/lib/schemas/auth";

export const signIn = createServerFn({ method: "POST" })
	.validator(signInSchema)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();

		try {
			const result = await auth.api.signInEmail({
				body: {
					email: data.email,
					password: data.password,
				},
				headers,
			});

			return { error: null, user: result.user };
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Invalid credentials";
			return { error: message, user: null };
		}
	});

export const signUp = createServerFn({ method: "POST" })
	.validator(signUpSchema)
	.handler(async ({ data }) => {
		const headers = getRequestHeaders();

		try {
			const result = await auth.api.signUpEmail({
				body: {
					name: data.name,
					email: data.email,
					password: data.password,
				},
				headers,
			});

			return { error: null, user: result.user };
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Could not create account";
			return { error: message, user: null };
		}
	});

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
	const headers = getRequestHeaders();
	await auth.api.signOut({ headers });
});
