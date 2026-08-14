import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";

import { can } from "#/lib/access-control";

const mainNavItems = [
	{ to: "/dashboard", label: "Dashboard" },
	{ to: "/articles", label: "Articles" },
	{ to: "/categories", label: "Knowledge Base" },
];

const adminNavItems = [
	{ to: "/admin", label: "Administration" },
	{ to: "/admin/categories", label: "Categories" },
];

type PortalShellProps = {
	user: {
		name: string;
		email: string;
		role?: string | null | undefined;
	};
};

export function PortalShell({ user }: PortalShellProps) {
	const { pathname } = useLocation();
	const navigate = useNavigate();

	const isActive = (to: string) =>
		pathname === to || pathname.startsWith(`${to}/`);

	const signOut = () => {
		void navigate({ to: "/sign-out" });
	};

	const adminVisible = can(user.role, { user: ["list"] });
	const navTargets = adminVisible
		? [...mainNavItems, ...adminNavItems]
		: mainNavItems;

	const renderNavItem = (item: (typeof mainNavItems)[number]) => (
		<Link
			key={item.to}
			to={item.to}
			className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
				isActive(item.to)
					? "bg-neutral-200/70 text-neutral-900"
					: "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
			}`}
		>
			{item.label}
		</Link>
	);

	return (
		<div className="min-h-dvh bg-neutral-50">
			<aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-neutral-200 bg-white lg:flex">
				<div className="flex h-16 items-center border-b border-neutral-200 px-5">
					<span className="text-sm font-semibold tracking-tight">
						ICT Support
					</span>
				</div>

				<nav className="flex-1 space-y-0.5 p-3">
					{navTargets.map(renderNavItem)}
				</nav>

				<div className="border-t border-neutral-200 p-3">
					<div className="flex items-center gap-3 rounded-md px-3 py-2">
						<div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-sm font-semibold text-neutral-700">
							{user.name.charAt(0).toUpperCase() ?? "U"}
						</div>
						<div className="min-w-0">
							<p className="truncate text-sm font-medium">{user.name}</p>
							<p className="truncate text-xs text-neutral-500">{user.email}</p>
						</div>
					</div>
					<button
						type="button"
						onClick={signOut}
						className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
					>
						Sign out
					</button>
				</div>
			</aside>

			<div className="sticky top-0 z-30 lg:hidden">
				<header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
					<span className="text-sm font-semibold tracking-tight">
						ICT Support
					</span>
					<button
						type="button"
						onClick={signOut}
						className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
					>
						Sign out
					</button>
				</header>

				<nav className="flex items-center gap-1 overflow-x-auto border-b border-neutral-200 bg-white px-4 py-2">
					{navTargets.map((item) => (
						<Link
							key={item.to}
							to={item.to}
							className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
								isActive(item.to)
									? "bg-neutral-200/70 text-neutral-900"
									: "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
							}`}
						>
							{item.label}
						</Link>
					))}
				</nav>
			</div>

			<main className="lg:pl-64">
				<div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
					<Outlet />
				</div>
			</main>
		</div>
	);
}
