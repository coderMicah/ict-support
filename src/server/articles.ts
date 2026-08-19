import { createServerFn } from "@tanstack/react-start";
import { can } from "#/lib/access-control";
import type { ArticleItem } from "#/lib/articles";
import {
	articleIdSchema,
	articleInputSchema,
	articleUpdateSchema,
} from "#/lib/schemas/articles";
import type { PortalUser } from "#/lib/types";

export const getArticles = createServerFn({
	method: "GET",
}).handler(async (): Promise<ArticleItem[]> => {
	const { requirePermission } = await import("./guard");
	const { listArticlesAction } = await import("#/lib/articles");

	await requirePermission({ articles: ["view"] });

	return listArticlesAction();
});

export const getArticle = createServerFn({
	method: "GET",
})
	.validator(articleIdSchema)
	.handler(async ({ data }): Promise<ArticleItem> => {
		const { requirePermission } = await import("./guard");
		const { getArticleAction } = await import("#/lib/articles");

		await requirePermission({ articles: ["view"] });

		return getArticleAction(data.id);
	});

export const createArticle = createServerFn({
	method: "POST",
})
	.validator(articleInputSchema)
	.handler(async ({ data }): Promise<ArticleItem> => {
		const { requirePermission } = await import("./guard");
		const { createArticleAction } = await import("#/lib/articles");

		await requirePermission({ articles: ["create"] });

		return createArticleAction(data);
	});

export const updateArticle = createServerFn({
	method: "POST",
})
	.validator(articleUpdateSchema)
	.handler(async ({ data }): Promise<ArticleItem> => {
		const { requirePermission } = await import("./guard");
		const { updateArticleAction } = await import("#/lib/articles");

		await requirePermission({ articles: ["update"] });

		return updateArticleAction(data.id, data);
	});

export const publishArticle = createServerFn({
	method: "POST",
})
	.validator(articleIdSchema)
	.handler(async ({ data }): Promise<ArticleItem> => {
		const { requirePermission, requireServerSession } = await import("./guard");
		const { publishArticleAction } = await import("#/lib/articles");

		const session = await requireServerSession();

		const hasRolePublish = can(session.user.role, { articles: ["publish"] });
		const user = session.user as PortalUser;
		const userCanPublish = user.canPublish === true;

		if (!hasRolePublish && !userCanPublish) {
			await requirePermission({ articles: ["publish"] });
		}

		return publishArticleAction(data.id);
	});

export const archiveArticle = createServerFn({
	method: "POST",
})
	.validator(articleIdSchema)
	.handler(async ({ data }): Promise<ArticleItem> => {
		const { requirePermission } = await import("./guard");
		const { archiveArticleAction } = await import("#/lib/articles");

		await requirePermission({ articles: ["archive"] });

		return archiveArticleAction(data.id);
	});

export const restoreArticle = createServerFn({
	method: "POST",
})
	.validator(articleIdSchema)
	.handler(async ({ data }): Promise<ArticleItem> => {
		const { requirePermission } = await import("./guard");
		const { restoreArticleAction } = await import("#/lib/articles");

		await requirePermission({ articles: ["restore"] });

		return restoreArticleAction(data.id);
	});

export const deleteArticle = createServerFn({
	method: "POST",
})
	.validator(articleIdSchema)
	.handler(async ({ data }): Promise<{ ok: true }> => {
		const { requirePermission } = await import("./guard");
		const { deleteArticleAction } = await import("#/lib/articles");

		await requirePermission({ articles: ["delete"] });

		await deleteArticleAction(data.id);

		return { ok: true };
	});
