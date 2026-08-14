import { createServerFn } from "@tanstack/react-start";

import {
	getPublicArticleAction,
	getPublicCategoryAction,
	getPublicKnowledgeBaseAction,
	listPublicCategoriesAction,
	type PublicArticleListItem,
	type PublicArticlePage,
	type PublicCategoryItem,
	type PublicCategoryPage,
	type PublicKnowledgeBase,
} from "#/lib/public";
import {
	publicArticleSlugSchema,
	publicCategorySlugSchema,
} from "#/lib/schemas/public";

/**
 * Read-only data functions for the public knowledge base. No session is
 * required: these surfaces never return drafts, unpublished, or archived
 * articles.
 */
export const getPublicKnowledgeBase = createServerFn({
	method: "GET",
}).handler(
	async (): Promise<PublicKnowledgeBase> => getPublicKnowledgeBaseAction(),
);

export const getPublicCategories = createServerFn({
	method: "GET",
}).handler(
	async (): Promise<PublicCategoryItem[]> => listPublicCategoriesAction(),
);

export const getPublicCategory = createServerFn({
	method: "GET",
})
	.validator(publicCategorySlugSchema)
	.handler(
		async ({ data }): Promise<PublicCategoryPage> =>
			getPublicCategoryAction(data.categorySlug),
	);

export const getPublicArticle = createServerFn({
	method: "GET",
})
	.validator(publicArticleSlugSchema)
	.handler(
		async ({ data }): Promise<PublicArticlePage> =>
			getPublicArticleAction(data.categorySlug, data.articleSlug),
	);

export type {
	PublicArticleListItem,
	PublicArticlePage,
	PublicCategoryItem,
	PublicCategoryPage,
};
