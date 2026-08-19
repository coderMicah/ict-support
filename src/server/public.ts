import { createServerFn } from "@tanstack/react-start";

import type { ContactItem } from "#/lib/contacts";
import type { PublicDocumentItem } from "#/lib/documents";
import type {
	PublicArticleListItem,
	PublicArticlePage,
	PublicCategoryItem,
	PublicCategoryPage,
	PublicKnowledgeBase,
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
}).handler(async (): Promise<PublicKnowledgeBase> => {
	const { getPublicKnowledgeBaseAction } = await import("#/lib/public");
	return getPublicKnowledgeBaseAction();
});

export const getPublicDocuments = createServerFn({
	method: "GET",
}).handler(async (): Promise<PublicDocumentItem[]> => {
	const { listApprovedDocumentsAction } = await import("#/lib/documents");
	return listApprovedDocumentsAction();
});

export const getPublicContacts = createServerFn({
	method: "GET",
}).handler(async (): Promise<ContactItem[]> => {
	const { listActiveContactsAction } = await import("#/lib/contacts");
	return listActiveContactsAction();
});

export const getPublicCategories = createServerFn({
	method: "GET",
}).handler(async (): Promise<PublicCategoryItem[]> => {
	const { listPublicCategoriesAction } = await import("#/lib/public");
	return listPublicCategoriesAction();
});

export const getPublicCategory = createServerFn({
	method: "GET",
})
	.validator(publicCategorySlugSchema)
	.handler(async ({ data }): Promise<PublicCategoryPage> => {
		const { getPublicCategoryAction } = await import("#/lib/public");
		return getPublicCategoryAction(data.categorySlug);
	});

export const getPublicArticle = createServerFn({
	method: "GET",
})
	.validator(publicArticleSlugSchema)
	.handler(async ({ data }): Promise<PublicArticlePage> => {
		const { getPublicArticleAction } = await import("#/lib/public");
		return getPublicArticleAction(data.categorySlug, data.articleSlug);
	});

export type {
	PublicArticleListItem,
	PublicArticlePage,
	PublicCategoryItem,
	PublicCategoryPage,
};
