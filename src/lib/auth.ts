import { betterAuth } from "better-auth";
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

	emailAndPassword: {
		enabled: true,
		autoSignIn: false,
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
