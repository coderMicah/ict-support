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
		},
	},

	emailAndPassword: {
		enabled: true,
		autoSignIn: true,
	},

	databaseHooks: {
		session: {
			create: {
				before: async (session, context) => {
					if (!context) {
						return;
					}

					const user = (await context.context.internalAdapter.findUserById(
						session.userId,
					)) as { id: string; approved?: boolean } | null;

					if (user && user.approved === false) {
						throw new APIError("FORBIDDEN", {
							code: "ACCOUNT_PENDING_APPROVAL",
							message: "Your account is pending admin approval.",
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

	trustedOrigins: ["http://localhost:3000", "http://localhost:3001"],
});
