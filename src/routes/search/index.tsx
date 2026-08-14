import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";

import { SearchBox } from "#/components/search/search-box";
import { emptySearchResult, type SearchResult } from "#/lib/search";
import { getSearchResults } from "#/server/search";

const searchSchema = z.object({
	q: z.string().trim().max(200).optional(),
});

export const Route = createFileRoute("/search/")({
	validateSearch: (search) => searchSchema.parse(search),
	loaderDeps: ({ search }) => ({ q: search.q }),
	loader: async ({ deps }): Promise<SearchResult> => {
		if (!deps.q) {
			return emptySearchResult("");
		}

		return getSearchResults({ data: { query: deps.q } });
	},
	head: () => ({
		meta: [
			{
				title: "Search · ICT Support",
			},
		],
	}),
	component: SearchPage,
});

function formatBytes(bytes: number): string {
	if (bytes < 1024) {
		return `${bytes} B`;
	}
	if (bytes < 1024 * 1024) {
		return `${Math.round(bytes / 1024)} KB`;
	}
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SearchPage() {
	const results = Route.useLoaderData();
	const { q } = Route.useSearch();

	const total =
		results.articles.length +
		results.documents.length +
		results.contacts.length;

	return (
		<div className="space-y-8">
			<header>
				<h1 className="text-3xl font-bold tracking-tight">Search</h1>
				<p className="mt-2 text-neutral-600">
					Search articles, documents, and ICT contacts across the knowledge
					base.
				</p>
			</header>

			<SearchBox initialQuery={q ?? ""} />

			{!q ? (
				<p className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
					Enter a term above to search articles, documents, and contacts.
				</p>
			) : total === 0 ? (
				<p className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
					No results for “{results.query}”.
				</p>
			) : (
				<div className="space-y-8">
					{results.articles.length > 0 && (
						<section>
							<h2 className="text-lg font-semibold tracking-tight">Articles</h2>
							<ul className="mt-3 space-y-3">
								{results.articles.map((article) => (
									<li key={`article-${article.id}`}>
										<Link
											to="/kb/$categorySlug/$articleSlug"
											params={{
												categorySlug: article.categorySlug,
												articleSlug: article.slug,
											}}
											className="block rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
										>
											<h3 className="text-sm font-semibold tracking-tight">
												{article.title}
											</h3>
											<p className="mt-1 text-sm text-neutral-500">
												{article.summary}
											</p>
											<p className="mt-2 text-xs text-neutral-400">
												{article.categoryName}
											</p>
										</Link>
									</li>
								))}
							</ul>
						</section>
					)}

					{results.documents.length > 0 && (
						<section>
							<h2 className="text-lg font-semibold tracking-tight">
								Documents
							</h2>
							<ul className="mt-3 space-y-3">
								{results.documents.map((document) => (
									<li key={`document-${document.id}`}>
										<a
											href={document.url}
											className="block rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
										>
											<h3 className="text-sm font-semibold tracking-tight">
												{document.title}
											</h3>
											<p className="mt-1 text-sm text-neutral-500">
												{document.originalName} · {formatBytes(document.size)}
											</p>
											<p className="mt-2 text-xs text-neutral-400">
												{document.categoryName ?? "Download"}
											</p>
										</a>
									</li>
								))}
							</ul>
						</section>
					)}

					{results.contacts.length > 0 && (
						<section>
							<h2 className="text-lg font-semibold tracking-tight">Contacts</h2>
							<ul className="mt-3 space-y-3">
								{results.contacts.map((contact) => (
									<li key={`contact-${contact.id}`}>
										<div className="rounded-lg border border-neutral-200 bg-white p-4">
											<h3 className="text-sm font-semibold tracking-tight">
												{contact.name}
											</h3>
											<p className="mt-0.5 text-sm text-neutral-500">
												{contact.role}
											</p>
											<div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
												{contact.phone && <span>{contact.phone}</span>}
												{contact.email && <span>{contact.email}</span>}
											</div>
										</div>
									</li>
								))}
							</ul>
						</section>
					)}
				</div>
			)}
		</div>
	);
}
