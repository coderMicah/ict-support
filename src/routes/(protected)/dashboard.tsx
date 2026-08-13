import { createFileRoute } from "@tanstack/react-router";

import { getPortalOverview } from "#/server/portal";

export const Route = createFileRoute("/(protected)/dashboard")({
	loader: () => getPortalOverview(),
	component: DashboardPage,
});

function DashboardPage() {
	const overview = Route.useLoaderData();
	const { user } = Route.useRouteContext();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
				<p className="mt-1 text-sm text-neutral-500">
					Welcome back, {overview.user.name}.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="rounded-lg border border-neutral-200 bg-white p-5">
					<p className="text-xs uppercase tracking-wider text-neutral-500">
						Account
					</p>
					<p className="mt-1 text-sm font-medium">{overview.user.email}</p>
				</div>
				<div className="rounded-lg border border-neutral-200 bg-white p-5">
					<p className="text-xs uppercase tracking-wider text-neutral-500">
						Role
					</p>
					<p className="mt-1 text-sm font-medium capitalize">
						{user.role ?? "user"}
					</p>
				</div>
			</div>
		</div>
	);
}
