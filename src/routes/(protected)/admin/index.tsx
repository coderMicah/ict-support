import { createFileRoute } from "@tanstack/react-router";

import { UserManagement } from "#/components/admin/user-management";
import { getAdminStats, getAdminUsers } from "#/server/admin";

export const Route = createFileRoute("/(protected)/admin/")({
	loader: async () => {
		const [stats, users] = await Promise.all([
			getAdminStats(),
			getAdminUsers(),
		]);

		return { stats, users };
	},
	component: AdminPage,
});

function AdminPage() {
	const { stats, users } = Route.useLoaderData();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">User Management</h1>
				<p className="mt-1 text-sm text-neutral-500">
					Manage user accounts and approvals.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-4">
				<div className="rounded-lg border border-neutral-200 bg-white p-5">
					<p className="text-xs uppercase tracking-wider text-neutral-500">
						Total users
					</p>
					<p className="mt-1 text-2xl font-bold">{stats.totalUsers}</p>
				</div>
				<div className="rounded-lg border border-neutral-200 bg-white p-5">
					<p className="text-xs uppercase tracking-wider text-neutral-500">
						Pending approval
					</p>
					<p className="mt-1 text-2xl font-bold">{stats.pendingCount}</p>
				</div>
				<div className="rounded-lg border border-neutral-200 bg-white p-5">
					<p className="text-xs uppercase tracking-wider text-neutral-500">
						Administrators
					</p>
					<p className="mt-1 text-2xl font-bold">{stats.adminCount}</p>
				</div>
				<div className="rounded-lg border border-neutral-200 bg-white p-5">
					<p className="text-xs uppercase tracking-wider text-neutral-500">
						Users
					</p>
					<p className="mt-1 text-2xl font-bold">{stats.userCount}</p>
				</div>
			</div>

			<div className="space-y-3">
				<h2 className="text-lg font-semibold tracking-tight">
					User management
				</h2>
				<UserManagement initialUsers={users} />
			</div>
		</div>
	);
}
