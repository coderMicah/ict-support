import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { can } from "#/lib/access-control";
import type { ArticleItem } from "#/lib/articles";
import { getErrorMessage } from "#/lib/errors";
import { formatDate } from "#/lib/utils";
import {
	archiveArticle,
	deleteArticle,
	getArticles,
	publishArticle,
	restoreArticle,
} from "#/server/articles";

const articlesSearchSchema = z.object({
	q: z.string().trim().max(200).optional(),
	state: z.enum(["draft", "published", "archived"]).optional(),
});

export const Route = createFileRoute("/(protected)/articles/")({
	validateSearch: (search) => articlesSearchSchema.parse(search),
	loader: async ({ context }) => ({
		articles: await getArticles(),
		user: context.user,
	}),
	component: ArticlesPage,
});

type ArticleState = "draft" | "published" | "archived";

function ArticlesPage() {
	const { articles, user } = Route.useLoaderData();
	const { q, state } = Route.useSearch();
	const router = useRouter();
	const navigate = Route.useNavigate();
	const [searchInput, setSearchInput] = useState(q ?? "");

	const canPublish =
		can(user.role, { articles: ["publish"] }) ||
		(user as { canPublish?: boolean }).canPublish === true;
	const canArchive = can(user.role, { articles: ["archive"] });
	const canRestore = can(user.role, { articles: ["restore"] });
	const canDelete = can(user.role, { articles: ["delete"] });

	const setFilter = (next: { q?: string; state?: ArticleState }) => {
		void navigate({
			search: {
				q: next.q ?? q,
				state: next.state ?? state,
			},
			replace: true,
		});
	};

	const filtered = articles.filter((article: ArticleItem) => {
		if (state && article.state !== state) return false;
		if (q) {
			const query = q.toLowerCase();
			return (
				article.title.toLowerCase().includes(query) ||
				article.categoryName.toLowerCase().includes(query) ||
				article.excerpt?.toLowerCase().includes(query)
			);
		}
		return true;
	});

	const runAction = async (
		action: () => Promise<unknown>,
		successMessage: string,
	) => {
		try {
			await action();
			toast.success(successMessage);
			await router.invalidate();
		} catch (error) {
			toast.error(getErrorMessage(error));
		}
	};

	const onDelete = (article: ArticleItem) => {
		const confirmed = window.confirm(
			`Permanently delete "${article.title}"? This cannot be undone.`,
		);

		if (!confirmed) {
			return;
		}

		void runAction(
			() => deleteArticle({ data: { id: article.id } }),
			"Article deleted.",
		);
	};

	const actionButtonClass =
		"rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium transition-colors hover:bg-neutral-100";

	const stateTabs = [
		{ label: "All", value: undefined as ArticleState | undefined },
		{ label: "Drafts", value: "draft" as const },
		{ label: "Published", value: "published" as const },
		{ label: "Archived", value: "archived" as const },
	];

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

			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex gap-1">
					{stateTabs.map((tab) => (
						<button
							key={tab.label}
							type="button"
							onClick={() =>
								setFilter({
									state: tab.value === state ? undefined : tab.value,
								})
							}
							className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
								state === tab.value || (!state && !tab.value)
									? "bg-neutral-900 text-white"
									: "text-neutral-600 hover:bg-neutral-100"
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>

				<input
					type="text"
					value={searchInput}
					onChange={(e) => setSearchInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							setFilter({ q: searchInput || undefined });
						}
					}}
					placeholder="Search articles..."
					className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none sm:w-64"
				/>
			</div>

			{filtered.length === 0 ? (
				<div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
					<p className="text-sm text-neutral-500">
						{articles.length === 0
							? "No articles yet. Write the first draft."
							: "No articles match your filters."}
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{filtered.map((article) => (
						<div
							key={article.id}
							className="rounded-lg border border-neutral-200 bg-white p-5"
						>
							<Link
								to="/articles/$articleId/edit"
								params={{ articleId: String(article.id) }}
								className="block"
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
									{article.categoryName} · Updated{" "}
									{formatDate(article.updatedAt)}
								</p>
							</Link>

							<div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
								<Link
									to="/kb/$categorySlug/$articleSlug"
									params={{
										categorySlug: article.categorySlug,
										articleSlug: article.slug,
									}}
									className={actionButtonClass}
								>
									View
								</Link>

								{article.state === "draft" && canPublish && (
									<button
										type="button"
										onClick={() =>
											void runAction(
												() => publishArticle({ data: { id: article.id } }),
												"Article published.",
											)
										}
										className={actionButtonClass}
									>
										Publish
									</button>
								)}

								{article.state === "published" && canArchive && (
									<button
										type="button"
										onClick={() =>
											void runAction(
												() => archiveArticle({ data: { id: article.id } }),
												"Article archived.",
											)
										}
										className={actionButtonClass}
									>
										Archive
									</button>
								)}

								{article.state === "archived" && canRestore && (
									<button
										type="button"
										onClick={() =>
											void runAction(
												() => restoreArticle({ data: { id: article.id } }),
												"Article restored.",
											)
										}
										className={actionButtonClass}
									>
										Restore
									</button>
								)}

								{canDelete && (
									<button
										type="button"
										onClick={() => onDelete(article)}
										className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
									>
										Delete permanently
									</button>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
