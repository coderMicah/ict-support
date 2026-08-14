import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";

import { db } from "#/db";
import { articles, categories, contacts, documents } from "#/db/schema";
import type { Role } from "#/lib/access-control";
import { deriveExcerpt } from "#/lib/lexical";

export type SearchArticleHit = {
	type: "article";
	id: number;
	slug: string;
	title: string;
	summary: string;
	categoryName: string;
	categorySlug: string;
	updatedAt: string;
};

export type SearchDocumentHit = {
	type: "document";
	id: number;
	title: string;
	categoryName: string | null;
	originalName: string;
	size: number;
	url: string;
	updatedAt: string;
};

export type SearchContactHit = {
	type: "contact";
	id: number;
	name: string;
	role: string;
	phone: string | null;
	email: string | null;
	coverage: string | null;
};

export type SearchResult = {
	query: string;
	articles: SearchArticleHit[];
	documents: SearchDocumentHit[];
	contacts: SearchContactHit[];
};

export function emptySearchResult(query: string): SearchResult {
	return { query, articles: [], documents: [], contacts: [] };
}

function normalizeQuery(query: string): string {
	return query.trim().replace(/\s+/g, " ");
}

function articleVisibility(role: Role | null) {
	const notDeleted = isNull(articles.deletedAt);

	if (!role) {
		return and(notDeleted, eq(articles.state, "published"));
	}

	return notDeleted;
}

function documentVisibility(role: Role | null) {
	const notDeleted = isNull(documents.deletedAt);

	if (!role) {
		return and(notDeleted, eq(documents.state, "approved"));
	}

	return notDeleted;
}

function contactVisibility(role: Role | null) {
	if (!role) {
		return eq(contacts.active, true);
	}

	return undefined;
}

type SearchArticleRow = {
	id: number;
	slug: string;
	title: string;
	excerpt: string | null;
	body: unknown;
	categoryName: string;
	categorySlug: string;
	updatedAt: Date;
};

type SearchDocumentRow = {
	id: number;
	title: string;
	categoryName: string | null;
	originalName: string;
	size: number;
	fileKey: string;
	updatedAt: Date;
};

type SearchContactRow = {
	id: number;
	name: string;
	role: string;
	phone: string | null;
	email: string | null;
	coverage: string | null;
};

/**
 * Full-text search across articles, documents, and contacts.
 *
 * A `null` role is a public visitor: only published articles, approved
 * documents, and active contacts are returned. Authenticated roles additionally
 * see the rows they may manage (drafts and pending content for officers,
 * everything including archived content for admins).
 */
export async function searchAction(
	query: string,
	role: Role | null,
	limit = 20,
): Promise<SearchResult> {
	const q = normalizeQuery(query);

	if (!q) {
		return emptySearchResult(q);
	}

	const tsquery = sql`plainto_tsquery('english', ${q})`;

	const [articleRows, documentRows, contactRows] = await Promise.all([
		db
			.select({
				id: articles.id,
				slug: articles.slug,
				title: articles.title,
				excerpt: articles.excerpt,
				body: articles.body,
				categoryName: categories.name,
				categorySlug: categories.slug,
				updatedAt: articles.updatedAt,
			})
			.from(articles)
			.innerJoin(categories, eq(articles.categoryId, categories.id))
			.where(
				and(
					articleVisibility(role),
					sql`${articles.searchVector} @@ ${tsquery}`,
				),
			)
			.orderBy(desc(sql`ts_rank(${articles.searchVector}, ${tsquery})`))
			.limit(limit),
		db
			.select({
				id: documents.id,
				title: documents.title,
				categoryName: categories.name,
				originalName: documents.originalName,
				size: documents.size,
				fileKey: documents.fileKey,
				updatedAt: documents.updatedAt,
			})
			.from(documents)
			.leftJoin(categories, eq(documents.categoryId, categories.id))
			.where(
				and(
					documentVisibility(role),
					sql`${documents.searchVector} @@ ${tsquery}`,
				),
			)
			.orderBy(desc(sql`ts_rank(${documents.searchVector}, ${tsquery})`))
			.limit(limit),
		db
			.select({
				id: contacts.id,
				name: contacts.name,
				role: contacts.role,
				phone: contacts.phone,
				email: contacts.email,
				coverage: contacts.coverage,
			})
			.from(contacts)
			.where(
				and(
					contactVisibility(role),
					sql`${contacts.searchVector} @@ ${tsquery}`,
				),
			)
			.orderBy(
				desc(sql`ts_rank(${contacts.searchVector}, ${tsquery})`),
				asc(contacts.sortOrder),
				asc(contacts.name),
			)
			.limit(limit),
	]);

	return {
		query: q,
		articles: articleRows.map((row: SearchArticleRow) => ({
			type: "article",
			id: row.id,
			slug: row.slug,
			title: row.title,
			summary: row.excerpt ?? deriveExcerpt(JSON.stringify(row.body)),
			categoryName: row.categoryName,
			categorySlug: row.categorySlug,
			updatedAt: row.updatedAt.toISOString(),
		})),
		documents: documentRows.map((row: SearchDocumentRow) => ({
			type: "document",
			id: row.id,
			title: row.title,
			categoryName: row.categoryName,
			originalName: row.originalName,
			size: row.size,
			url: `/uploads/documents/${row.fileKey}`,
			updatedAt: row.updatedAt.toISOString(),
		})),
		contacts: contactRows.map((row: SearchContactRow) => ({
			type: "contact",
			id: row.id,
			name: row.name,
			role: row.role,
			phone: row.phone,
			email: row.email,
			coverage: row.coverage,
		})),
	};
}
