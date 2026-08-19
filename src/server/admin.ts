import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { desc, eq } from "drizzle-orm";

import { db } from "#/db";
import { user } from "#/db/schema";
import { auth } from "#/lib/auth";
import { setUserRoleSchema } from "#/lib/schemas/admin";

import { requireAdminRole } from "./guard";

export type AdminUser = {
	id: string;
	name: string;
	email: string;
	role: string | null;
	createdAt: string;
};

export type AdminStats = {
	totalUsers: number;
	adminCount: number;
	userCount: number;
	recentUsers: AdminUser[];
};

const selectUserRow = {
	id: user.id,
	name: user.name,
	email: user.email,
	role: user.role,
	createdAt: user.createdAt,
};

type UserRow = {
	id: string;
	name: string;
	email: string;
	role: string | null;
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

	const recentUsers = await db
		.select(selectUserRow)
		.from(user)
		.orderBy(desc(user.createdAt))
		.limit(10);

	return {
		totalUsers,
		adminCount,
		userCount,
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

export const setUserRole = createServerFn({
	method: "POST",
})
	.validator(setUserRoleSchema)
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
