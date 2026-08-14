import { createFileRoute, Link } from "@tanstack/react-router";

import { useSession } from "#/lib/auth-client";
import { getPublicKnowledgeBase } from "#/server/public";

export const Route = createFileRoute("/")({
	loader: () => getPublicKnowledgeBase(),
	component: Home,
});

function Home() {
	const { data: session } = useSession();
	const { categories } = Route.useLoaderData();

	return (
		<div className="flex min-h-dvh flex-col">
			<header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
				<span className="text-sm font-semibold tracking-tight">
					ICT Support
				</span>
				<div className="flex items-center gap-3">
					<Link
						to="/kb"
						className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-neutral-100"
					>
						Browse knowledge base
					</Link>
					<Link
						to="/downloads"
						className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-neutral-100"
					>
						Downloads
					</Link>
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
				</div>
			</header>

			<main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6">
				<section className="text-center">
					<h1 className="text-4xl font-bold">ICT Support Portal</h1>
					<p className="mx-auto mt-4 max-w-xl text-lg text-neutral-600">
						Guides and how-to articles published by the ICT department. Browse
						the knowledge base without signing in; officers sign in to create
						and manage content.
					</p>
					<div className="mt-6 flex justify-center gap-3">
						<Link
							to="/kb"
							className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
						>
							Browse the knowledge base
						</Link>
					</div>
				</section>

				<section className="mt-12">
					<h2 className="text-lg font-semibold tracking-tight">
						Browse by category
					</h2>
					{categories.length === 0 ? (
						<p className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
							No published articles yet. Check back soon.
						</p>
					) : (
						<div className="mt-3 grid gap-4 sm:grid-cols-2">
							{categories.map((category) => (
								<Link
									key={category.slug}
									to="/kb/$categorySlug"
									params={{ categorySlug: category.slug }}
									className="flex flex-col rounded-lg border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
								>
									<h3 className="text-base font-semibold tracking-tight">
										{category.name}
									</h3>
									{category.description && (
										<p className="mt-1 text-sm text-neutral-500">
											{category.description}
										</p>
									)}
									<p className="mt-auto pt-3 text-xs text-neutral-400">
										{category.publishedArticleCount}{" "}
										{category.publishedArticleCount === 1
											? "article"
											: "articles"}
									</p>
								</Link>
							))}
						</div>
					)}
				</section>
			</main>
		</div>
	);
}
