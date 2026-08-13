import { createFileRoute } from "@tanstack/react-router";

import { getAdminStats } from "#/server/admin";

export const Route = createFileRoute("/(protected)/admin/")({
	loader: () => getAdminStats(),
	component: AdminPage,
});

function AdminPage() {
	const stats = Route.useLoaderData();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Administration</h1>
				<p className="mt-1 text-sm text-neutral-500">
					Manage users and portal administration.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				<div className="rounded-lg border border-neutral-200 bg-white p-5">
					<p className="text-xs uppercase tracking-wider text-neutral-500">
						Total users
					</p>
					<p className="mt-1 text-2xl font-bold">{stats.totalUsers}</p>
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

			<div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
				<table className="w-full min-w-[560px] text-sm">
					<thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wider text-neutral-500">
						<tr>
							<th className="px-4 py-3 font-medium">Name</th>
							<th className="px-4 py-3 font-medium">Email</th>
							<th className="px-4 py-3 font-medium">Role</th>
							<th className="px-4 py-3 font-medium">Created</th>
						</tr>
					</thead>
					<tbody>
						{stats.recentUsers.map((row) => (
							<tr
								key={row.id}
								className="border-b border-neutral-200 last:border-0"
							>
								<td className="px-4 py-3 font-medium">{row.name}</td>
								<td className="px-4 py-3 text-neutral-500">{row.email}</td>
								<td className="px-4 py-3 capitalize">{row.role ?? "user"}</td>
								<td className="px-4 py-3 text-neutral-500">
									{new Date(row.createdAt).toLocaleDateString()}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
