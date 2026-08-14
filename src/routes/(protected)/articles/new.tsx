import { createFileRoute } from "@tanstack/react-router";

import { ArticleForm } from "#/components/articles/article-form";
import { getCategories } from "#/server/categories";

export const Route = createFileRoute("/(protected)/articles/new")({
	loader: () => getCategories(),
	component: NewArticlePage,
});

function NewArticlePage() {
	const categories = Route.useLoaderData();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">New article</h1>
				<p className="mt-1 text-sm text-neutral-500">
					Write a draft. It stays a draft until it is published.
				</p>
			</div>

			<ArticleForm mode="create" categories={categories} />
		</div>
	);
}
