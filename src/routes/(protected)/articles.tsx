import { createFileRoute, Link } from "@tanstack/react-router";

import { getArticles } from "#/server/articles";

export const Route = createFileRoute("/(protected)/articles")({
	loader: () => getArticles(),
	component: ArticlesPage,
});

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function ArticlesPage() {
	const articles = Route.useLoaderData();

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Articles</h1>
					<p className="mt-1 text-sm text-neutral-500">
						Draft knowledge base articles shared with your team.
					</p>
				</div>
				<Link
					to="/articles/new"
					className="shrink-0 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
				>
					New article
				</Link>
			</div>

			{articles.length === 0 ? (
				<div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
					<p className="text-sm text-neutral-500">
						No articles yet. Write the first draft.
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{articles.map((article) => (
						<Link
							key={article.id}
							to="/articles/$articleId/edit"
							params={{ articleId: String(article.id) }}
							className="block rounded-lg border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
						>
							<div className="flex items-start justify-between gap-4">
								<h2 className="text-base font-semibold tracking-tight">
									{article.title}
								</h2>
								<span className="inline-flex shrink-0 items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium capitalize text-neutral-600">
									{article.state}
								</span>
							</div>
							{article.excerpt && (
								<p className="mt-1 text-sm text-neutral-500">
									{article.excerpt}
								</p>
							)}
							<p className="mt-3 text-xs text-neutral-400">
								{article.categoryName} · Updated {formatDate(article.updatedAt)}
							</p>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
