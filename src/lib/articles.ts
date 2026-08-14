import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "#/db";
import { articles, categories } from "#/db/schema";
import { isDuplicateSlug } from "#/lib/db-errors";
import { AppError } from "#/lib/errors";
import { emptyLexicalState } from "#/lib/lexical";
import { type ArticleInput, articleInputSchema } from "#/lib/schemas/articles";

export type ArticleItem = {
	id: number;
	title: string;
	slug: string;
	excerpt: string | null;
	body: string;
	state: string;
	categoryId: number;
	categoryName: string;
	categorySlug: string;
	createdAt: string;
	updatedAt: string;
};

type ArticleRow = {
	id: number;
	title: string;
	slug: string;
	excerpt: string | null;
	body: unknown;
	state: string;
	categoryId: number;
	categoryName: string;
	categorySlug: string;
	createdAt: Date;
	updatedAt: Date;
};

const selectArticleRow = {
	id: articles.id,
	title: articles.title,
	slug: articles.slug,
	excerpt: articles.excerpt,
	body: articles.body,
	state: articles.state,
	categoryId: articles.categoryId,
	categoryName: categories.name,
	categorySlug: categories.slug,
	createdAt: articles.createdAt,
	updatedAt: articles.updatedAt,
};

function toArticleItem(row: ArticleRow): ArticleItem {
	return {
		id: row.id,
		title: row.title,
		slug: row.slug,
		excerpt: row.excerpt,
		body: JSON.stringify(row.body),
		state: row.state,
		categoryId: row.categoryId,
		categoryName: row.categoryName,
		categorySlug: row.categorySlug,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

function toBody(input: ArticleInput): unknown {
	return input.body ? JSON.parse(input.body) : emptyLexicalState;
}

async function assertCategoryExists(categoryId: number): Promise<void> {
	const [row] = await db
		.select({ id: categories.id })
		.from(categories)
		.where(eq(categories.id, categoryId));

	if (!row) {
		throw new AppError(
			"The selected category does not exist.",
			"INVALID_CATEGORY",
			400,
		);
	}
}

async function getArticleRowById(id: number): Promise<ArticleRow | undefined> {
	const [row] = await db
		.select(selectArticleRow)
		.from(articles)
		.innerJoin(categories, eq(articles.categoryId, categories.id))
		.where(and(eq(articles.id, id), isNull(articles.deletedAt)));

	return row;
}

export async function listArticlesAction(): Promise<ArticleItem[]> {
	const rows = await db
		.select(selectArticleRow)
		.from(articles)
		.innerJoin(categories, eq(articles.categoryId, categories.id))
		.where(isNull(articles.deletedAt))
		.orderBy(desc(articles.updatedAt));

	return rows.map(toArticleItem);
}

export async function getArticleAction(id: number): Promise<ArticleItem> {
	const row = await getArticleRowById(id);

	if (!row) {
		throw new AppError("Article not found.", "NOT_FOUND", 404);
	}

	return toArticleItem(row);
}

export async function createArticleAction(
	input: unknown,
): Promise<ArticleItem> {
	const data = articleInputSchema.parse(input);

	await assertCategoryExists(data.categoryId);

	try {
		const [row] = await db
			.insert(articles)
			.values({
				title: data.title,
				slug: data.slug,
				excerpt: data.excerpt ? data.excerpt : null,
				body: toBody(data),
				state: "draft",
				categoryId: data.categoryId,
			})
			.returning({ id: articles.id });

		return await getArticleAction(row.id);
	} catch (error) {
		if (isDuplicateSlug(error)) {
			throw new AppError(
				"An article with this slug already exists.",
				"DUPLICATE_SLUG",
				409,
			);
		}

		throw error;
	}
}

export type ArticleState = "draft" | "published" | "archived";

export const articleStates: readonly ArticleState[] = [
	"draft",
	"published",
	"archived",
];

/**
 * Admin-only article lifecycle actions and the states each one may leave.
 * Deleting is intentionally absent: any state can be permanently deleted.
 */
const articleTransitions: Record<
	ArticleState,
	{ target: ArticleState; verb: string }
> = {
	draft: { target: "published", verb: "publish" },
	published: { target: "archived", verb: "archive" },
	archived: { target: "published", verb: "restore" },
};

function assertLegalTransition(
	current: string,
	transition: keyof typeof articleTransitions,
): void {
	if (current !== transition) {
		throw new AppError(
			`An article in the "${current}" state cannot be ${articleTransitions[transition].verb}ed.`,
			"ILLEGAL_STATE_TRANSITION",
			409,
		);
	}
}

async function setArticleState(
	id: number,
	transition: keyof typeof articleTransitions,
): Promise<ArticleItem> {
	const row = await getArticleRowById(id);

	if (!row) {
		throw new AppError("Article not found.", "NOT_FOUND", 404);
	}

	assertLegalTransition(row.state, transition);

	await db
		.update(articles)
		.set({ state: articleTransitions[transition].target })
		.where(and(eq(articles.id, id), isNull(articles.deletedAt)));

	return await getArticleAction(id);
}

export async function publishArticleAction(id: number): Promise<ArticleItem> {
	return setArticleState(id, "draft");
}

export async function archiveArticleAction(id: number): Promise<ArticleItem> {
	return setArticleState(id, "published");
}

export async function restoreArticleAction(id: number): Promise<ArticleItem> {
	return setArticleState(id, "archived");
}

export async function deleteArticleAction(id: number): Promise<void> {
	const [row] = await db
		.delete(articles)
		.where(and(eq(articles.id, id), isNull(articles.deletedAt)))
		.returning({ id: articles.id });

	if (!row) {
		throw new AppError("Article not found.", "NOT_FOUND", 404);
	}
}

export async function updateArticleAction(
	id: number,
	input: unknown,
): Promise<ArticleItem> {
	const data = articleInputSchema.parse(input);

	await assertCategoryExists(data.categoryId);

	try {
		const [row] = await db
			.update(articles)
			.set({
				title: data.title,
				slug: data.slug,
				excerpt: data.excerpt ? data.excerpt : null,
				body: toBody(data),
				categoryId: data.categoryId,
			})
			.where(and(eq(articles.id, id), isNull(articles.deletedAt)))
			.returning({ id: articles.id });

		if (!row) {
			throw new AppError("Article not found.", "NOT_FOUND", 404);
		}

		return await getArticleAction(row.id);
	} catch (error) {
		if (isDuplicateSlug(error)) {
			throw new AppError(
				"An article with this slug already exists.",
				"DUPLICATE_SLUG",
				409,
			);
		}

		throw error;
	}
}
