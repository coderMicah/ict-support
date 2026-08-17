import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { desc, eq } from "drizzle-orm";

import { db } from "#/db";
import { user } from "#/db/schema";
import { auth } from "#/lib/auth";

import { requireAdminRole } from "./guard";

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

const selectUserRow = {
	id: user.id,
	name: user.name,
	email: user.email,
	role: user.role,
	approved: user.approved,
	canPublish: user.canPublish,
	createdAt: user.createdAt,
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
	await requireAdminRole();

	const totalUsers = await db.$count(user);
	const adminCount = await db.$count(user, eq(user.role, "admin"));
	const userCount = await db.$count(user, eq(user.role, "user"));
	const pendingCount = await db.$count(user, eq(user.approved, false));

	const recentUsers = await db
		.select(selectUserRow)
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
	await requireAdminRole();

	const rows = await db
		.select(selectUserRow)
		.from(user)
		.orderBy(desc(user.createdAt));

	return rows.map(toAdminUser);
});

export const setUserApproval = createServerFn({
	method: "POST",
})
	.validator((data: { userId: string; approved: boolean }) => data)
	.handler(async ({ data }) => {
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
	.validator((data: { userId: string; role: "admin" | "user" }) => data)
	.handler(async ({ data }) => {
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
	.validator((data: { userId: string; canPublish: boolean }) => data)
	.handler(async ({ data }) => {
		await requireAdminRole();

		await db
			.update(user)
			.set({ canPublish: data.canPublish })
			.where(eq(user.id, data.userId));

		return { ok: true };
	});
