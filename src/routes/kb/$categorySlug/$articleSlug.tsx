import { createFileRoute, Link } from "@tanstack/react-router";

import { ArticleView } from "#/components/kb/article-view";
import { getPublicArticle } from "#/server/public";

export const Route = createFileRoute("/kb/$categorySlug/$articleSlug")({
	loader: ({ params }) =>
		getPublicArticle({
			data: {
				categorySlug: params.categorySlug,
				articleSlug: params.articleSlug,
			},
		}),
	head: ({ loaderData }) => {
		const page = loaderData;

		if (!page || page.notFound) {
			return {
				meta: [{ title: "Article not found · ICT Support" }],
			};
		}

		return {
			meta: [
				{
					title: `${page.article.title} · ICT Support`,
				},
				{
					name: "description",
					content: page.article.summary,
				},
				{
					property: "og:title",
					content: page.article.title,
				},
				{
					property: "og:description",
					content: page.article.summary,
				},
				{
					property: "og:type",
					content: "article",
				},
			],
		};
	},
	component: ArticlePage,
});

function ArticlePage() {
	const page = Route.useLoaderData();

	if (page.notFound) {
		return (
			<div className="rounded-lg border border-neutral-200 bg-neutral-50 p-10 text-center">
				<h1 className="text-2xl font-bold tracking-tight">Article not found</h1>
				<p className="mt-2 text-sm text-neutral-500">
					This article does not exist, has not been published, or is no longer
					available.
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
		<ArticleView
			article={page.article}
			related={page.related}
			reportEmail={page.reportEmail}
		/>
	);
}
