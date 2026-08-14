import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "#/db";
import { articles } from "#/db/schema";
import {
	createArticleAction,
	getArticleAction,
	listArticlesAction,
	updateArticleAction,
} from "#/lib/articles";
import { createCategoryAction } from "#/lib/categories";

const bodyWithText = JSON.stringify({
	root: {
		children: [
			{
				type: "paragraph",
				version: 1,
				children: [
					{ type: "text", version: 1, text: "Body content" },
				],
			},
		],
		direction: null,
		format: "",
		indent: 0,
		version: 1,
	},
});

let categoryId = 0;

beforeEach(async () => {
	await db.execute(sql`TRUNCATE TABLE categories RESTART IDENTITY CASCADE`);

	const category = await createCategoryAction({
		name: "Networking",
		slug: "networking",
		sortOrder: 0,
	});
	categoryId = category.id;
});

const validInput = (overrides: Record<string, unknown> = {}) => ({
	title: "Article title",
	slug: "article-title",
	categoryId,
	excerpt: "An excerpt.",
	body: bodyWithText,
	...overrides,
});

describe("createArticleAction", () => {
	it("creates a draft article with the given category", async () => {
		const article = await createArticleAction(validInput());

		expect(article.id).toBeGreaterThan(0);
		expect(article.title).toBe("Article title");
		expect(article.slug).toBe("article-title");
		expect(article.excerpt).toBe("An excerpt.");
		expect(JSON.parse(article.body)).toMatchObject(JSON.parse(bodyWithText));
		expect(article.categoryId).toBe(categoryId);
		expect(article.categoryName).toBe("Networking");
		expect(article.state).toBe("draft");
		expect(article.createdAt).toBeTruthy();
	});

	it("stores an empty editor state when the body is omitted", async () => {
		const article = await createArticleAction(validInput({ body: undefined }));

		expect(JSON.parse(article.body)).toMatchObject({
			root: expect.objectContaining({ children: [] }),
		});
	});

	it("rejects invalid input", async () => {
		await expect(
			createArticleAction(validInput({ title: "", slug: "Bad Slug!" })),
		).rejects.toThrow();
	});

	it("rejects an unknown category", async () => {
		await expect(
			createArticleAction(validInput({ categoryId: 9999 })),
		).rejects.toMatchObject({ code: "INVALID_CATEGORY" });
	});

	it("rejects a duplicate slug", async () => {
		await createArticleAction(validInput());

		await expect(
			createArticleAction(validInput({ title: "Other", slug: "article-title" })),
		).rejects.toMatchObject({ code: "DUPLICATE_SLUG" });
	});
});

describe("getArticleAction", () => {
	it("returns an existing article", async () => {
		const created = await createArticleAction(validInput());

		const article = await getArticleAction(created.id);

		expect(article.id).toBe(created.id);
		expect(article.title).toBe("Article title");
	});

	it("throws NOT_FOUND for a missing article", async () => {
		await expect(getArticleAction(9999)).rejects.toMatchObject({
			code: "NOT_FOUND",
		});
	});
});

describe("updateArticleAction", () => {
	it("updates an article and keeps its state unchanged", async () => {
		const created = await createArticleAction(validInput());

		await db
			.update(articles)
			.set({ state: "published" })
			.where(sql`id = ${created.id}`);

		const updated = await updateArticleAction(
			created.id,
			validInput({
				title: "Renamed",
				slug: "renamed",
				excerpt: "New excerpt.",
			}),
		);

		expect(updated.title).toBe("Renamed");
		expect(updated.slug).toBe("renamed");
		expect(updated.excerpt).toBe("New excerpt.");
		expect(updated.state).toBe("published");
		expect(updated.createdAt).toBe(created.createdAt);
	});

	it("throws NOT_FOUND for a missing article", async () => {
		await expect(
			updateArticleAction(9999, validInput()),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});

	it("rejects a duplicate slug on update", async () => {
		const a = await createArticleAction(validInput({ slug: "aaa" }));
		await createArticleAction(validInput({ title: "B", slug: "bbb" }));

		await expect(
			updateArticleAction(a.id, validInput({ slug: "bbb" })),
		).rejects.toMatchObject({ code: "DUPLICATE_SLUG" });
	});

	it("rejects an unknown category on update", async () => {
		const created = await createArticleAction(validInput());

		await expect(
			updateArticleAction(created.id, validInput({ categoryId: 9999 })),
		).rejects.toMatchObject({ code: "INVALID_CATEGORY" });
	});
});

describe("listArticlesAction", () => {
	it("returns non-deleted articles ordered by most recently updated", async () => {
		const first = await createArticleAction(validInput({ slug: "first" }));
		await createArticleAction(validInput({ title: "Second", slug: "second" }));

		const rows = await listArticlesAction();

		expect(rows).toHaveLength(2);
		expect(rows.map((row) => row.slug)).toEqual(["second", "first"]);

		await db
			.update(articles)
			.set({ deletedAt: new Date() })
			.where(sql`id = ${first.id}`);

		const remaining = await listArticlesAction();

		expect(remaining.map((row) => row.slug)).toEqual(["second"]);
	});
});
