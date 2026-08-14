import { asc, eq } from "drizzle-orm";

import { db } from "#/db";
import { categories } from "#/db/schema";
import { getPgError, isDuplicateSlug } from "#/lib/db-errors";
import { AppError } from "#/lib/errors";
import {
	type CategoryInput,
	categoryInputSchema,
} from "#/lib/schemas/categories";

export type CategoryItem = {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
};

type CategoryRow = {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	sortOrder: number;
	createdAt: Date;
	updatedAt: Date;
};

function toCategoryItem(row: CategoryRow): CategoryItem {
	return {
		id: row.id,
		name: row.name,
		slug: row.slug,
		description: row.description,
		sortOrder: row.sortOrder,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

function toValues(input: CategoryInput) {
	return {
		name: input.name,
		slug: input.slug,
		description: input.description ? input.description : null,
		sortOrder: input.sortOrder,
	};
}

export async function listCategoriesAction(): Promise<CategoryItem[]> {
	const rows = await db
		.select()
		.from(categories)
		.orderBy(asc(categories.sortOrder), asc(categories.name));

	return rows.map(toCategoryItem);
}

export async function createCategoryAction(
	input: unknown,
): Promise<CategoryItem> {
	const data = categoryInputSchema.parse(input);

	try {
		const [row] = await db
			.insert(categories)
			.values(toValues(data))
			.returning();

		return toCategoryItem(row);
	} catch (error) {
		if (isDuplicateSlug(error)) {
			throw new AppError(
				"A category with this slug already exists.",
				"DUPLICATE_SLUG",
				409,
			);
		}

		throw error;
	}
}

export async function updateCategoryAction(
	id: number,
	input: unknown,
): Promise<CategoryItem> {
	const data = categoryInputSchema.parse(input);

	try {
		const [row] = await db
			.update(categories)
			.set(toValues(data))
			.where(eq(categories.id, id))
			.returning();

		if (!row) {
			throw new AppError("Category not found.", "NOT_FOUND", 404);
		}

		return toCategoryItem(row);
	} catch (error) {
		if (isDuplicateSlug(error)) {
			throw new AppError(
				"A category with this slug already exists.",
				"DUPLICATE_SLUG",
				409,
			);
		}

		throw error;
	}
}

export async function deleteCategoryAction(id: number): Promise<void> {
	try {
		const [row] = await db
			.delete(categories)
			.where(eq(categories.id, id))
			.returning({ id: categories.id });

		if (!row) {
			throw new AppError("Category not found.", "NOT_FOUND", 404);
		}
	} catch (error) {
		if (getPgError(error)?.code === "23503") {
			throw new AppError(
				"This category cannot be deleted because it is still used by articles or documents.",
				"CATEGORY_IN_USE",
				409,
			);
		}

		throw error;
	}
}
