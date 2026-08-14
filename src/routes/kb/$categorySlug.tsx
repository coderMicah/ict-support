import { createFileRoute, Link } from "@tanstack/react-router";

import { getPublicCategory } from "#/server/public";

export const Route = createFileRoute("/kb/$categorySlug")({
	loader: ({ params }) =>
		getPublicCategory({ data: { categorySlug: params.categorySlug } }),
	head: ({ loaderData }) => {
		const page = loaderData;

		if (!page || page.notFound) {
			return {
				meta: [{ title: "Category not found · ICT Support" }],
			};
		}

		return {
			meta: [
				{
					title: `${page.category.name} · ICT Support`,
				},
				{
					name: "description",
					content:
						page.category.description ??
						`Published articles in ${page.category.name}.`,
				},
			],
		};
	},
	component: CategoryPage,
});

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function CategoryPage() {
	const page = Route.useLoaderData();

	if (page.notFound) {
		return (
			<div className="rounded-lg border border-neutral-200 bg-neutral-50 p-10 text-center">
				<h1 className="text-2xl font-bold tracking-tight">
					Category not found
				</h1>
				<p className="mt-2 text-sm text-neutral-500">
					This category does not exist or has no published articles.
				</p>
				<Link
					to="/kb"
					className="mt-4 inline-block rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-neutral-100"
				>
					Back to the knowledge base
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<nav className="flex items-center gap-2 text-sm text-neutral-500">
				<Link to="/kb" className="transition-colors hover:text-neutral-900">
					Knowledge Base
				</Link>
				<span aria-hidden>⁄</span>
				<span>{page.category.name}</span>
			</nav>

			<header>
				<h1 className="text-3xl font-bold tracking-tight">
					{page.category.name}
				</h1>
				{page.category.description && (
					<p className="mt-2 text-neutral-600">{page.category.description}</p>
				)}
			</header>

			{page.articles.length === 0 ? (
				<p className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
					No articles have been published in this category yet.
				</p>
			) : (
				<ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
					{page.articles.map((article) => (
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
									Updated {formatDate(article.updatedAt)}
								</span>
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
