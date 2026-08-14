import { createServerFn } from "@tanstack/react-start";

import {
	type ArticleItem,
	archiveArticleAction,
	createArticleAction,
	deleteArticleAction,
	getArticleAction,
	listArticlesAction,
	publishArticleAction,
	restoreArticleAction,
	updateArticleAction,
} from "#/lib/articles";
import {
	articleIdSchema,
	articleInputSchema,
	articleUpdateSchema,
} from "#/lib/schemas/articles";

import { requirePermission } from "./guard";

export const getArticles = createServerFn({
	method: "GET",
}).handler(async (): Promise<ArticleItem[]> => {
	await requirePermission({ articles: ["view"] });

	return listArticlesAction();
});

export const getArticle = createServerFn({
	method: "GET",
})
	.validator(articleIdSchema)
	.handler(async ({ data }): Promise<ArticleItem> => {
		await requirePermission({ articles: ["view"] });

		return getArticleAction(data.id);
	});

export const createArticle = createServerFn({
	method: "POST",
})
	.validator(articleInputSchema)
	.handler(async ({ data }): Promise<ArticleItem> => {
		await requirePermission({ articles: ["create"] });

		return createArticleAction(data);
	});

export const updateArticle = createServerFn({
	method: "POST",
})
	.validator(articleUpdateSchema)
	.handler(async ({ data }): Promise<ArticleItem> => {
		await requirePermission({ articles: ["update"] });

		return updateArticleAction(data.id, data);
	});

export const publishArticle = createServerFn({
	method: "POST",
})
	.validator(articleIdSchema)
	.handler(async ({ data }): Promise<ArticleItem> => {
		await requirePermission({ articles: ["publish"] });

		return publishArticleAction(data.id);
	});

export const archiveArticle = createServerFn({
	method: "POST",
})
	.validator(articleIdSchema)
	.handler(async ({ data }): Promise<ArticleItem> => {
		await requirePermission({ articles: ["archive"] });

		return archiveArticleAction(data.id);
	});

export const restoreArticle = createServerFn({
	method: "POST",
})
	.validator(articleIdSchema)
	.handler(async ({ data }): Promise<ArticleItem> => {
		await requirePermission({ articles: ["restore"] });

		return restoreArticleAction(data.id);
	});

export const deleteArticle = createServerFn({
	method: "POST",
})
	.validator(articleIdSchema)
	.handler(async ({ data }): Promise<{ ok: true }> => {
		await requirePermission({ articles: ["delete"] });

		await deleteArticleAction(data.id);

		return { ok: true };
	});
