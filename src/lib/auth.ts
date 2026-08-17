import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { db } from "#/db";
import * as schema from "#/db/schema";
import { ac, roles } from "#/lib/access-control";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),

	user: {
		additionalFields: {
			approved: {
				type: "boolean",
				required: false,
				input: false,
				defaultValue: false,
			},
			canPublish: {
				type: "boolean",
				required: false,
				input: false,
				defaultValue: false,
			},
		},
	},

	emailAndPassword: {
		enabled: true,
		autoSignIn: false,
	},

	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					const password = user?.password;
					if (typeof password === "string") {
						if (password.length < 8) {
							throw new APIError("BAD_REQUEST", {
								code: "PASSWORD_TOO_SHORT",
								message: "Password must be at least 8 characters.",
							});
						}
						if (!/[A-Z]/.test(password)) {
							throw new APIError("BAD_REQUEST", {
								code: "PASSWORD_TOO_WEAK",
								message: "Password must contain an uppercase letter.",
							});
						}
						if (!/[0-9]/.test(password)) {
							throw new APIError("BAD_REQUEST", {
								code: "PASSWORD_TOO_WEAK",
								message: "Password must contain a number.",
							});
						}
					}
				},
			},
		},
		session: {
			create: {
				before: async (session, context) => {
					if (!context) {
						return;
					}

					const user = (await context.context.internalAdapter.findUserById(
						session.userId,
					)) as { id: string; approved?: boolean; banned?: boolean } | null;

					if (user && user.approved === false) {
						throw new APIError("FORBIDDEN", {
							code: "ACCOUNT_PENDING_APPROVAL",
							message: "Your account is pending admin approval.",
						});
					}

					if (user?.banned) {
						throw new APIError("FORBIDDEN", {
							code: "ACCOUNT_SUSPENDED",
							message: "Your account has been suspended.",
						});
					}
				},
			},
		},
	},

	plugins: [
		admin({
			defaultRole: "user",
			adminRoles: ["admin"],
			roles,
			ac,
		}),
		tanstackStartCookies(),
	],

	trustedOrigins: (process.env.TRUSTED_ORIGINS ?? "")
		.split(",")
		.filter(Boolean)
		.concat([
			process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
			"http://localhost:3000",
			"http://localhost:3001",
		]),
});
