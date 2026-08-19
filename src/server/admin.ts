import { createServerFn } from "@tanstack/react-start";

import {
	setPublishPermissionSchema,
	setUserApprovalSchema,
	setUserRoleSchema,
} from "#/lib/schemas/admin";

export type AdminUser = {
	id: string;
	name: string;
	email: string;
	role: string | null;
	approved: boolean;
	canPublish: boolean;
	createdAt: string;
};

export type AdminStats = {
	totalUsers: number;
	adminCount: number;
	userCount: number;
	pendingCount: number;
	recentUsers: AdminUser[];
};

type UserRow = {
	id: string;
	name: string;
	email: string;
	role: string | null;
	approved: boolean;
	canPublish: boolean;
	createdAt: Date;
};

const toAdminUser = (row: UserRow): AdminUser => ({
	...row,
	createdAt: row.createdAt.toISOString(),
});

export const getAdminStats = createServerFn({
	method: "GET",
}).handler(async (): Promise<AdminStats> => {
	const { requireAdminRole } = await import("./guard");
	const { desc, eq } = await import("drizzle-orm");
	const { db } = await import("#/db");
	const { user } = await import("#/db/schema");

	await requireAdminRole();

	const totalUsers = await db.$count(user);
	const adminCount = await db.$count(user, eq(user.role, "admin"));
	const userCount = await db.$count(user, eq(user.role, "user"));
	const pendingCount = await db.$count(user, eq(user.approved, false));

	const recentUsers = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			approved: user.approved,
			canPublish: user.canPublish,
			createdAt: user.createdAt,
		})
		.from(user)
		.orderBy(desc(user.createdAt))
		.limit(10);

	return {
		totalUsers,
		adminCount,
		userCount,
		pendingCount,
		recentUsers: recentUsers.map(toAdminUser),
	};
});

export const getAdminUsers = createServerFn({
	method: "GET",
}).handler(async (): Promise<AdminUser[]> => {
	const { requireAdminRole } = await import("./guard");
	const { desc } = await import("drizzle-orm");
	const { db } = await import("#/db");
	const { user } = await import("#/db/schema");

	await requireAdminRole();

	const rows = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			approved: user.approved,
			canPublish: user.canPublish,
			createdAt: user.createdAt,
		})
		.from(user)
		.orderBy(desc(user.createdAt));

	return rows.map(toAdminUser);
});

export const setUserApproval = createServerFn({
	method: "POST",
})
	.validator(setUserApprovalSchema)
	.handler(async ({ data }) => {
		const { requireAdminRole } = await import("./guard");
		const { getRequestHeaders } = await import("@tanstack/react-start/server");
		const { auth } = await import("#/lib/auth");

		const session = await requireAdminRole();

		if (session.user.id === data.userId) {
			return { ok: true };
		}

		await auth.api.adminUpdateUser({
			body: {
				userId: data.userId,
				data: { approved: data.approved },
			},
			headers: getRequestHeaders(),
		});

		if (!data.approved) {
			await auth.api.revokeUserSessions({
				body: { userId: data.userId },
				headers: getRequestHeaders(),
			});
		}

		return { ok: true };
	});

export const setUserRole = createServerFn({
	method: "POST",
})
	.validator(setUserRoleSchema)
	.handler(async ({ data }) => {
		const { requireAdminRole } = await import("./guard");
		const { getRequestHeaders } = await import("@tanstack/react-start/server");
		const { auth } = await import("#/lib/auth");

		const session = await requireAdminRole();

		if (session.user.id === data.userId) {
			return { ok: true };
		}

		await auth.api.setRole({
			body: {
				userId: data.userId,
				role: data.role,
			},
			headers: getRequestHeaders(),
		});

		return { ok: true };
	});

export const setPublishPermission = createServerFn({
	method: "POST",
})
	.validator(setPublishPermissionSchema)
	.handler(async ({ data }) => {
		const { requireAdminRole } = await import("./guard");
		const { eq } = await import("drizzle-orm");
		const { db } = await import("#/db");
		const { user } = await import("#/db/schema");

		await requireAdminRole();

		await db
			.update(user)
			.set({ canPublish: data.canPublish })
			.where(eq(user.id, data.userId));

		return { ok: true };
	});
