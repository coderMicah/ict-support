import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";

import { db } from "#/db";
import { user } from "#/db/schema";

import { requireAdminSession } from "./guard";

export type AdminStats = {
	totalUsers: number;
	adminCount: number;
	userCount: number;
	recentUsers: Array<{
		id: string;
		name: string;
		email: string;
		role: string | null;
		createdAt: string;
	}>;
};

export const getAdminStats = createServerFn({
	method: "GET",
}).handler(async (): Promise<AdminStats> => {
	await requireAdminSession();

	const totalUsers = await db.$count(user);
	const adminCount = await db.$count(user, eq(user.role, "admin"));
	const userCount = await db.$count(user, eq(user.role, "user"));

	const recentUsers = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			createdAt: user.createdAt,
		})
		.from(user)
		.orderBy(desc(user.createdAt))
		.limit(10);

	return {
		totalUsers,
		adminCount,
		userCount,
		recentUsers: recentUsers.map((row) => ({
			...row,
			createdAt: row.createdAt.toISOString(),
		})),
	};
});
