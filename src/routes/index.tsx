import { createFileRoute, Link } from "@tanstack/react-router";

import { useSession } from "#/lib/auth-client";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	const { data: session } = useSession();

	return (
		<div className="flex min-h-dvh flex-col">
			<header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
				<span className="text-sm font-semibold tracking-tight">
					ICT Support
				</span>
				{session?.user ? (
					<Link
						to="/dashboard"
						className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
					>
						Go to dashboard
					</Link>
				) : (
					<Link
						to="/sign-in"
						className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
					>
						Sign in
					</Link>
				)}
			</header>

			<main className="flex flex-1 items-center justify-center p-8">
				<div className="max-w-xl text-center">
					<h1 className="text-4xl font-bold">ICT Support Portal</h1>
					<p className="mt-4 text-lg text-neutral-600">
						The central knowledge base for the ICT department. Sign in to access
						published articles, documents, and support resources.
					</p>
				</div>
			</main>
		</div>
	);
}
