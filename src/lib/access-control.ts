import { createAccessControl } from "better-auth/plugins/access";
import {
	adminAc,
	defaultStatements,
	userAc,
} from "better-auth/plugins/admin/access";

/**
 * Application access-control statements.
 *
 * Better Auth provides the built-in `user` and `session` resources through
 * `defaultStatements`. The remaining resources belong to the ICT Knowledge
 * Base application.
 *
 * Roles:
 * - admin: Head of ICT
 * - user: ICT Officer
 */
export const statement = {
	...defaultStatements,

	categories: ["view", "create", "update", "delete"],

	articles: [
		"view",
		"create",
		"update",
		"delete",
		"publish",
		"archive",
		"restore",
	],

	documents: [
		"view",
		"create",
		"update",
		"delete",
		"approve",
		"archive",
		"restore",
	],

	contacts: ["view", "create", "update", "delete"],
} as const;

export type Statement = typeof statement;

/**
 * Application access-control instance.
 */
export const ac = createAccessControl(statement);

/**
 * Application roles.
 *
 * admin
 * -----
 * Represents the Head of ICT.
 * Has Better Auth's default admin permissions plus full access
 * to all ICT Knowledge Base resources.
 *
 * user
 * ----
 * Represents an ICT Officer.
 * Can manage knowledge-base content but cannot perform
 * administrative user/session management or publish/approve
 * official content.
 */
export const roles = {
	admin: ac.newRole({
		...adminAc.statements,

		categories: ["view", "create", "update", "delete"],

		articles: [
			"view",
			"create",
			"update",
			"delete",
			"publish",
			"archive",
			"restore",
		],

		documents: [
			"view",
			"create",
			"update",
			"delete",
			"approve",
			"archive",
			"restore",
		],

		contacts: ["view", "create", "update", "delete"],
	}),

	user: ac.newRole({
		...userAc.statements,

		categories: ["view"],

		articles: ["view", "create", "update"],

		documents: ["view", "create", "update"],

		contacts: ["view", "update"],
	}),
} as const;

export type Role = keyof typeof roles;

/**
 * Represents a permission request against the application's
 * access-control statements.
 */
export type Permission = {
	[K in keyof Statement]?: (typeof statement)[K][number][];
};

/**
 * Checks whether a role has the requested permission.
 *
 * This helper is intended for server-side authorization.
 * UI checks may also use it to conditionally display actions,
 * but every protected server operation must perform its own
 * authorization check.
 */
export function can(
	role: string | null | undefined,
	permission: Permission,
): boolean {
	if (!role || !(role in roles)) {
		return false;
	}

	return roles[role as Role].authorize(permission).success;
}
