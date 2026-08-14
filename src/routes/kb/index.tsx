import { createFileRoute, Link } from "@tanstack/react-router";

import { getPublicKnowledgeBase } from "#/server/public";

export const Route = createFileRoute("/kb/")({
	loader: () => getPublicKnowledgeBase(),
	head: () => ({
		meta: [
			{
				title: "Knowledge Base · ICT Support",
			},
			{
				name: "description",
				content:
					"Published ICT guidance and how-to articles for staff, organised by category.",
			},
		],
	}),
	component: KnowledgeBaseHome,
});

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function KnowledgeBaseHome() {
	const { categories, recentArticles } = Route.useLoaderData();

	return (
		<div className="space-y-10">
			<header>
				<h1 className="text-3xl font-bold tracking-tight">
					ICT Knowledge Base
				</h1>
				<p className="mt-2 text-neutral-600">
					Guides and how-to articles published by the ICT department.
				</p>
			</header>

			<section>
				<h2 className="text-lg font-semibold tracking-tight">Categories</h2>
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

			{recentArticles.length > 0 && (
				<section>
					<h2 className="text-lg font-semibold tracking-tight">
						Recently published
					</h2>
					<ul className="mt-3 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
						{recentArticles.map((article) => (
							<li key={article.slug}>
								<Link
									to="/kb/$categorySlug/$articleSlug"
									params={{
										categorySlug: article.categorySlug,
										articleSlug: article.slug,
									}}
									className="block p-4 transition-colors hover:bg-neutral-50"
								>
									<span className="font-medium text-neutral-900">
										{article.title}
									</span>
									<span className="mt-0.5 block text-sm text-neutral-500">
										{article.summary}
									</span>
									<span className="mt-2 block text-xs text-neutral-400">
										{article.categoryName} · Updated{" "}
										{formatDate(article.updatedAt)}
									</span>
								</Link>
							</li>
						))}
					</ul>
				</section>
			)}
		</div>
	);
}
