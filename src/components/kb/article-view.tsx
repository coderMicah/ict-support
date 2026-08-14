import { Link } from "@tanstack/react-router";

import { renderLexicalBody } from "#/lib/lexical-html";
import type { PublicArticleListItem } from "#/lib/public";

type ArticleViewProps = {
	article: {
		slug: string;
		title: string;
		summary: string;
		body: string;
		categorySlug: string;
		categoryName: string;
		updatedAt: string;
	};
	related: PublicArticleListItem[];
	reportEmail: string;
};

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export function ArticleView({
	article,
	related,
	reportEmail,
}: ArticleViewProps) {
	const currentUrl = typeof window !== "undefined" ? window.location.href : "";
	const mailtoSubject = encodeURIComponent(
		`Report or suggestion: ${article.title}`,
	);
	const mailtoBody = encodeURIComponent(
		`Article: ${article.title}${currentUrl ? `\nURL: ${currentUrl}` : ""}\n\nPlease describe the problem or suggestion:`,
	);
	const mailtoHref = `mailto:${reportEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;

	return (
		<article className="space-y-6">
			<nav className="flex items-center gap-2 text-sm text-neutral-500">
				<Link to="/kb" className="transition-colors hover:text-neutral-900">
					Knowledge Base
				</Link>
				<span aria-hidden>⁄</span>
				<Link
					to="/kb/$categorySlug"
					params={{ categorySlug: article.categorySlug }}
					className="transition-colors hover:text-neutral-900"
				>
					{article.categoryName}
				</Link>
			</nav>

			<header>
				<h1 className="text-3xl font-bold tracking-tight">{article.title}</h1>
				<p className="mt-3 text-sm text-neutral-500">
					{article.categoryName} · Updated {formatDate(article.updatedAt)}
				</p>
				{article.summary && (
					<p className="mt-4 text-lg leading-relaxed text-neutral-600">
						{article.summary}
					</p>
				)}
			</header>

			{/* HTML is produced by the sanitized renderLexicalBody serializer (escaped text, allowlisted URLs). */}
			<div
				className="kb-prose rounded-lg border border-neutral-200 bg-white p-6 sm:p-8"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized renderLexicalBody output
				dangerouslySetInnerHTML={{ __html: renderLexicalBody(article.body) }}
			/>

			{related.length > 0 && (
				<section>
					<h2 className="text-lg font-semibold tracking-tight">
						Related articles
					</h2>
					<ul className="mt-3 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
						{related.map((item) => (
							<li key={item.slug}>
								<Link
									to="/kb/$categorySlug/$articleSlug"
									params={{
										categorySlug: item.categorySlug,
										articleSlug: item.slug,
									}}
									className="block p-4 transition-colors hover:bg-neutral-50"
								>
									<span className="font-medium text-neutral-900">
										{item.title}
									</span>
									{item.summary && (
										<span className="mt-0.5 block text-sm text-neutral-500">
											{item.summary}
										</span>
									)}
								</Link>
							</li>
						))}
					</ul>
				</section>
			)}

			<footer className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
				<p className="text-sm text-neutral-600">
					Spotted a problem or want to suggest a change?{" "}
					<a
						href={mailtoHref}
						className="font-medium text-neutral-900 underline"
					>
						Report a problem or suggest a change
					</a>
					.
				</p>
			</footer>
		</article>
	);
}
