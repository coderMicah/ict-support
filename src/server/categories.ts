import { createServerFn } from "@tanstack/react-start";

import {
	type CategoryItem,
	createCategoryAction,
	deleteCategoryAction,
	listCategoriesAction,
	updateCategoryAction,
} from "#/lib/categories";
import {
	categoryIdSchema,
	categoryInputSchema,
	categoryUpdateSchema,
} from "#/lib/schemas/categories";

import { requirePermission } from "./guard";

export const getCategories = createServerFn({
	method: "GET",
}).handler(async (): Promise<CategoryItem[]> => {
	await requirePermission({ categories: ["view"] });

	return listCategoriesAction();
});

export const createCategory = createServerFn({
	method: "POST",
})
	.validator(categoryInputSchema)
	.handler(async ({ data }): Promise<CategoryItem> => {
		await requirePermission({ categories: ["create"] });

		return createCategoryAction(data);
	});

export const updateCategory = createServerFn({
	method: "POST",
})
	.validator(categoryUpdateSchema)
	.handler(async ({ data }): Promise<CategoryItem> => {
		await requirePermission({ categories: ["update"] });

		return updateCategoryAction(data.id, data);
	});

export const deleteCategory = createServerFn({
	method: "POST",
})
	.validator(categoryIdSchema)
	.handler(async ({ data }): Promise<{ ok: true }> => {
		await requirePermission({ categories: ["delete"] });

		await deleteCategoryAction(data.id);

		return { ok: true };
	});
