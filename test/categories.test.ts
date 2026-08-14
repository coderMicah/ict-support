import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "#/db";
import { createArticleAction } from "#/lib/articles";
import {
	createCategoryAction,
	deleteCategoryAction,
	listCategoriesAction,
	updateCategoryAction,
} from "#/lib/categories";

beforeEach(async () => {
	await db.execute(sql`TRUNCATE TABLE categories RESTART IDENTITY CASCADE`);
});

describe("listCategoriesAction", () => {
	it("returns categories ordered by sort order, then name", async () => {
		await createCategoryAction({ name: "B", slug: "b", sortOrder: 2 });
		await createCategoryAction({ name: "A", slug: "a", sortOrder: 1 });
		await createCategoryAction({ name: "C", slug: "c", sortOrder: 1 });

		const rows = await listCategoriesAction();

		expect(rows.map((row) => row.name)).toEqual(["A", "C", "B"]);
	});
});

describe("createCategoryAction", () => {
	it("creates and returns a category", async () => {
		const category = await createCategoryAction({
			name: "Networking",
			slug: "networking",
			description: "Network guides and troubleshooting.",
			sortOrder: 1,
		});

		expect(category.id).toBeGreaterThan(0);
		expect(category.name).toBe("Networking");
		expect(category.slug).toBe("networking");
		expect(category.description).toBe("Network guides and troubleshooting.");
		expect(category.sortOrder).toBe(1);
		expect(category.createdAt).toBeTruthy();
		expect(category.updatedAt).toBeTruthy();
	});

	it("stores an empty description as null", async () => {
		const category = await createCategoryAction({
			name: "Hardware",
			slug: "hardware",
			sortOrder: 0,
		});

		expect(category.description).toBeNull();
	});

	it("rejects invalid input", async () => {
		await expect(
			createCategoryAction({ name: "", slug: "Bad Slug!", sortOrder: -1 }),
		).rejects.toThrow();
	});

	it("rejects a duplicate slug", async () => {
		await createCategoryAction({ name: "A", slug: "dup", sortOrder: 0 });

		await expect(
			createCategoryAction({ name: "B", slug: "dup", sortOrder: 0 }),
		).rejects.toMatchObject({ code: "DUPLICATE_SLUG" });
	});
});

describe("updateCategoryAction", () => {
	it("updates a category", async () => {
		const created = await createCategoryAction({
			name: "Old",
			slug: "old",
			sortOrder: 0,
		});

		const updated = await updateCategoryAction(created.id, {
			name: "New",
			slug: "new",
			description: "Updated description",
			sortOrder: 5,
		});

		expect(updated.id).toBe(created.id);
		expect(updated.name).toBe("New");
		expect(updated.slug).toBe("new");
		expect(updated.description).toBe("Updated description");
		expect(updated.sortOrder).toBe(5);
	});

	it("throws NOT_FOUND for a missing category", async () => {
		await expect(
			updateCategoryAction(9999, { name: "X", slug: "x", sortOrder: 0 }),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});

	it("rejects a duplicate slug on update", async () => {
		const a = await createCategoryAction({ name: "A", slug: "a", sortOrder: 0 });
		await createCategoryAction({ name: "B", slug: "b", sortOrder: 0 });

		await expect(
			updateCategoryAction(a.id, { name: "A", slug: "b", sortOrder: 0 }),
		).rejects.toMatchObject({ code: "DUPLICATE_SLUG" });
	});
});

describe("deleteCategoryAction", () => {
	it("deletes an unused category", async () => {
		const created = await createCategoryAction({
			name: "Temporary",
			slug: "temporary",
			sortOrder: 0,
		});

		await deleteCategoryAction(created.id);

		await expect(listCategoriesAction()).resolves.toHaveLength(0);
	});

	it("throws NOT_FOUND for a missing category", async () => {
		await expect(deleteCategoryAction(9999)).rejects.toMatchObject({
			code: "NOT_FOUND",
		});
	});

	it("throws CATEGORY_IN_USE when articles reference the category", async () => {
		const created = await createCategoryAction({
			name: "In Use",
			slug: "in-use",
			sortOrder: 0,
		});

		await createArticleAction({
			title: "Article",
			slug: "article",
			categoryId: created.id,
		});

		await expect(deleteCategoryAction(created.id)).rejects.toMatchObject({
			code: "CATEGORY_IN_USE",
		});
	});
});
