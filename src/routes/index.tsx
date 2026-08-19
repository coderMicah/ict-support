import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { KnowledgeBaseShell } from "#/components/kb/kb-shell";
import { SearchBox } from "#/components/search/search-box";
import { formatDate } from "#/lib/utils";
import { getPublicKnowledgeBase } from "#/server/public";

export const Route = createFileRoute("/")({
	beforeLoad: ({ context }) => {
		if (context.session) {
			throw redirect({
				to: "/dashboard",
			});
		}
	},
	loader: () => getPublicKnowledgeBase(),
	head: () => ({
		meta: [
			{
				title: "ICT Support Portal",
			},
			{
				name: "description",
				content:
					"ICT guides and how-to articles for staff. Search the knowledge base, browse by category, and contact the ICT department.",
			},
		],
	}),
	component: Home,
});

function Home() {
	const { categories, recentArticles } = Route.useLoaderData();

	return (
		<KnowledgeBaseShell>
			<div className="space-y-12">
				<section className="text-center">
					<h1 className="text-4xl font-bold tracking-tight">
						ICT Support Portal
					</h1>
					<p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
						Guides and how-to articles published by the ICT department. Search
						the knowledge base, browse by category, or contact the ICT team
						directly — no sign-in required.
					</p>
					<div className="mx-auto mt-8 max-w-xl">
						<SearchBox />
					</div>
					<p className="mt-4 text-sm text-neutral-500">
						<Link
							to="/kb"
							className="inline-flex items-center gap-1.5 font-medium text-neutral-700 underline-offset-4 hover:underline"
						>
							Browse the full knowledge base
							<ArrowRight className="size-4" aria-hidden="true" />
						</Link>
					</p>
				</section>

				<section>
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
		</KnowledgeBaseShell>
	);
}
