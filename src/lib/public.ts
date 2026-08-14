import { and, asc, desc, eq, isNull, ne, sql } from "drizzle-orm";

import { db } from "#/db";
import { articles, categories } from "#/db/schema";
import { deriveExcerpt } from "#/lib/lexical";

export type PublicCategoryItem = {
	slug: string;
	name: string;
	description: string | null;
	publishedArticleCount: number;
};

export type PublicArticleListItem = {
	slug: string;
	title: string;
	summary: string;
	categorySlug: string;
	categoryName: string;
	updatedAt: string;
};

export type PublicArticlePage =
	| { notFound: true }
	| {
			notFound: false;
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

export type PublicCategoryPage =
	| { notFound: true }
	| {
			notFound: false;
			category: {
				slug: string;
				name: string;
				description: string | null;
			};
			articles: PublicArticleListItem[];
	  };

export type PublicKnowledgeBase = {
	categories: PublicCategoryItem[];
	recentArticles: PublicArticleListItem[];
};

/**
 * The e-mail address staff use to report problems with or suggest changes to
 * published articles. Configurable by the site operator; falls back to a
 * sensible internal default.
 */
export function getReportEmail(): string {
	return process.env.ICT_CONTACT_EMAIL?.trim() || "support@ict.local";
}

type PublicArticleRow = {
	id: number;
	slug: string;
	title: string;
	excerpt: string | null;
	body: unknown;
	categorySlug: string;
	categoryName: string;
	updatedAt: Date;
};

const selectPublicArticleRow = {
	id: articles.id,
	slug: articles.slug,
	title: articles.title,
	excerpt: articles.excerpt,
	body: articles.body,
	categorySlug: categories.slug,
	categoryName: categories.name,
	updatedAt: articles.updatedAt,
};

const isPublishedArticle = and(
	eq(articles.state, "published"),
	isNull(articles.deletedAt),
);

function toPublicListItem(row: PublicArticleRow): PublicArticleListItem {
	return {
		slug: row.slug,
		title: row.title,
		summary: row.excerpt ?? deriveExcerpt(JSON.stringify(row.body)),
		categorySlug: row.categorySlug,
		categoryName: row.categoryName,
		updatedAt: row.updatedAt.toISOString(),
	};
}

export async function listPublicCategoriesAction(): Promise<
	PublicCategoryItem[]
> {
	const rows = await db
		.select({
			slug: categories.slug,
			name: categories.name,
			description: categories.description,
			publishedArticleCount: sql<number>`count(${articles.id})::int`,
		})
		.from(categories)
		.leftJoin(
			articles,
			and(eq(articles.categoryId, categories.id), isPublishedArticle),
		)
		.groupBy(categories.id)
		.having(sql`count(${articles.id}) > 0`)
		.orderBy(asc(categories.sortOrder), asc(categories.name));

	return rows.map((row) => ({
		slug: row.slug,
		name: row.name,
		description: row.description,
		publishedArticleCount: Number(row.publishedArticleCount),
	}));
}

export async function getPublicKnowledgeBaseAction(
	recentLimit = 5,
): Promise<PublicKnowledgeBase> {
	const [categoryRows, recentRows] = await Promise.all([
		listPublicCategoriesAction(),
		db
			.select(selectPublicArticleRow)
			.from(articles)
			.innerJoin(categories, eq(articles.categoryId, categories.id))
			.where(isPublishedArticle)
			.orderBy(desc(articles.updatedAt))
			.limit(recentLimit),
	]);

	return {
		categories: categoryRows,
		recentArticles: recentRows.map(toPublicListItem),
	};
}

export async function getPublicCategoryAction(
	slug: string,
): Promise<PublicCategoryPage> {
	const [category] = await db
		.select({
			slug: categories.slug,
			name: categories.name,
			description: categories.description,
		})
		.from(categories)
		.where(eq(categories.slug, slug));

	if (!category) {
		return { notFound: true };
	}

	const rows = await db
		.select(selectPublicArticleRow)
		.from(articles)
		.innerJoin(categories, eq(articles.categoryId, categories.id))
		.where(and(eq(categories.slug, slug), isPublishedArticle))
		.orderBy(desc(articles.updatedAt));

	return {
		notFound: false,
		category: {
			slug: category.slug,
			name: category.name,
			description: category.description,
		},
		articles: rows.map(toPublicListItem),
	};
}

export async function getPublicArticleAction(
	categorySlug: string,
	articleSlug: string,
): Promise<PublicArticlePage> {
	const [row] = await db
		.select(selectPublicArticleRow)
		.from(articles)
		.innerJoin(categories, eq(articles.categoryId, categories.id))
		.where(and(eq(articles.slug, articleSlug), isPublishedArticle));

	if (!row || row.categorySlug !== categorySlug) {
		return { notFound: true };
	}

	const relatedRows = await db
		.select(selectPublicArticleRow)
		.from(articles)
		.innerJoin(categories, eq(articles.categoryId, categories.id))
		.where(
			and(
				eq(categories.slug, row.categorySlug),
				eq(articles.state, "published"),
				isNull(articles.deletedAt),
				ne(articles.slug, articleSlug),
			),
		)
		.orderBy(desc(articles.updatedAt))
		.limit(5);

	return {
		notFound: false,
		article: {
			slug: row.slug,
			title: row.title,
			summary: row.excerpt ?? deriveExcerpt(JSON.stringify(row.body)),
			body: JSON.stringify(row.body),
			categorySlug: row.categorySlug,
			categoryName: row.categoryName,
			updatedAt: row.updatedAt.toISOString(),
		},
		related: relatedRows.map(toPublicListItem),
		reportEmail: getReportEmail(),
	};
}
