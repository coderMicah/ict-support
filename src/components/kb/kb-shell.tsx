import { Link, Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useSession } from "#/lib/auth-client";

export function KnowledgeBaseShell({ children }: { children?: ReactNode }) {
	const { data: session } = useSession();

	return (
		<div className="flex min-h-dvh flex-col bg-white">
			<header className="sticky top-0 z-30 border-b border-neutral-200 bg-white">
				<div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
					<Link to="/kb" className="text-sm font-semibold tracking-tight">
						ICT Support
					</Link>

					<nav className="flex items-center gap-1">
						<Link
							to="/"
							className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
						>
							Home
						</Link>
						<Link
							to="/kb"
							className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
						>
							Knowledge Base
						</Link>
						<Link
							to="/search"
							className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
						>
							Search
						</Link>
						<Link
							to="/downloads"
							className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
						>
							Downloads
						</Link>
						<Link
							to="/staff-contacts"
							className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
						>
							Contacts
						</Link>
					</nav>

					{session?.user ? (
						<Link
							to="/dashboard"
							className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
						>
							Dashboard
						</Link>
					) : (
						<Link
							to="/sign-in"
							className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-neutral-100"
						>
							Sign in
						</Link>
					)}
				</div>
			</header>

			<main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
				{children ?? <Outlet />}
			</main>

			<footer className="border-t border-neutral-200">
				<div className="mx-auto max-w-4xl px-4 py-6 text-center text-xs text-neutral-400 sm:px-6">
					ICT Support · {new Date().getFullYear()}
				</div>
			</footer>
		</div>
	);
}
