import { createServerFn } from "@tanstack/react-start";

import type { CategoryItem } from "#/lib/categories";
import {
	categoryIdSchema,
	categoryInputSchema,
	categoryUpdateSchema,
} from "#/lib/schemas/categories";

export const getCategories = createServerFn({
	method: "GET",
}).handler(async (): Promise<CategoryItem[]> => {
	const { requirePermission } = await import("./guard");
	const { listCategoriesAction } = await import("#/lib/categories");

	await requirePermission({ categories: ["view"] });

	return listCategoriesAction();
});

export const createCategory = createServerFn({
	method: "POST",
})
	.validator(categoryInputSchema)
	.handler(async ({ data }): Promise<CategoryItem> => {
		const { requirePermission } = await import("./guard");
		const { createCategoryAction } = await import("#/lib/categories");

		await requirePermission({ categories: ["create"] });

		return createCategoryAction(data);
	});

export const updateCategory = createServerFn({
	method: "POST",
})
	.validator(categoryUpdateSchema)
	.handler(async ({ data }): Promise<CategoryItem> => {
		const { requirePermission } = await import("./guard");
		const { updateCategoryAction } = await import("#/lib/categories");

		await requirePermission({ categories: ["update"] });

		return updateCategoryAction(data.id, data);
	});

export const deleteCategory = createServerFn({
	method: "POST",
})
	.validator(categoryIdSchema)
	.handler(async ({ data }): Promise<{ ok: true }> => {
		const { requirePermission } = await import("./guard");
		const { deleteCategoryAction } = await import("#/lib/categories");

		await requirePermission({ categories: ["delete"] });

		await deleteCategoryAction(data.id);

		return { ok: true };
	});
