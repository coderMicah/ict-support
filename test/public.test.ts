import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "#/db";
import {
	archiveArticleAction,
	createArticleAction,
	publishArticleAction,
} from "#/lib/articles";
import { createCategoryAction } from "#/lib/categories";
import {
	getPublicArticleAction,
	getPublicCategoryAction,
	getPublicKnowledgeBaseAction,
	listPublicCategoriesAction,
} from "#/lib/public";

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

let networkingId = 0;
let printingId = 0;

beforeEach(async () => {
	await db.execute(sql`TRUNCATE TABLE categories RESTART IDENTITY CASCADE`);

	const networking = await createCategoryAction({
		name: "Networking",
		slug: "networking",
		description: "Network guides.",
		sortOrder: 0,
	});
	const printing = await createCategoryAction({
		name: "Printing",
		slug: "printing",
		description: "Printer guides.",
		sortOrder: 1,
	});
	networkingId = networking.id;
	printingId = printing.id;
});

const input = (overrides: Record<string, unknown> = {}) => ({
	title: "Guide",
	slug: "guide",
	categoryId: networkingId,
	body: bodyWithText,
	...overrides,
});

describe("listPublicCategoriesAction", () => {
	it("lists only categories with published articles and counts them", async () => {
		const guide = await createArticleAction(input());
		const otherCat = await createArticleAction(
			input({ title: "Other cat", slug: "other-cat", categoryId: printingId }),
		);
		await createArticleAction(
			input({ title: "Draft", slug: "draft", body: undefined }),
		);
		await publishArticleAction(guide.id);

		const rows = await listPublicCategoriesAction();

		expect(rows).toEqual([
			{
				slug: "networking",
				name: "Networking",
				description: "Network guides.",
				publishedArticleCount: 1,
			},
		]);

		await publishArticleAction(otherCat.id);

		const rowsAfter = await listPublicCategoriesAction();

		expect(rowsAfter).toHaveLength(2);
		expect(rowsAfter[1]).toMatchObject({
			slug: "printing",
			publishedArticleCount: 1,
		});
	});

	it("excludes categories without published articles", async () => {
		const rows = await listPublicCategoriesAction();

		expect(rows).toEqual([]);
	});
});

describe("getPublicKnowledgeBaseAction", () => {
	it("returns recent published articles across categories", async () => {
		const a = await createArticleAction(input({ title: "A", slug: "a" }));
		await createArticleAction(input({ title: "B", slug: "b" }));
		await publishArticleAction(a.id);

		const kb = await getPublicKnowledgeBaseAction();

		expect(kb.categories).toHaveLength(1);
		expect(kb.recentArticles.map((item) => item.slug)).toEqual(["a"]);
	});
});

describe("getPublicCategoryAction", () => {
	it("returns published articles only, newest first", async () => {
		const a = await createArticleAction(input({ title: "A", slug: "a" }));
		const b = await createArticleAction(input({ title: "B", slug: "b" }));
		await createArticleAction(
			input({ title: "Draft", slug: "draft", body: undefined }),
		);
		await publishArticleAction(a.id);
		await publishArticleAction(b.id);
		await archiveArticleAction(b.id);

		const page = await getPublicCategoryAction("networking");

		if (page.notFound) {
			throw new Error("Expected category to be found");
		}

		expect(page.category).toMatchObject({
			slug: "networking",
			name: "Networking",
			description: "Network guides.",
		});
		expect(page.articles.map((item) => item.slug)).toEqual(["a"]);
	});

	it("returns an empty article list for a category with no published articles", async () => {
		const page = await getPublicCategoryAction("printing");

		if (page.notFound) {
			throw new Error("Expected category to be found");
		}

		expect(page.articles).toEqual([]);
	});

	it("returns notFound for an unknown category slug", async () => {
		const page = await getPublicCategoryAction("nope");

		expect(page.notFound).toBe(true);
	});
});

describe("getPublicArticleAction", () => {
	it("returns a published article and derives a summary when no excerpt", async () => {
		const created = await createArticleAction(input());
		await publishArticleAction(created.id);

		const page = await getPublicArticleAction("networking", "guide");

		if (page.notFound) {
			throw new Error("Expected article to be found");
		}

		expect(page.article.title).toBe("Guide");
		expect(page.article.summary).toBe("Body content");
		expect(page.article.categorySlug).toBe("networking");
		expect(page.article.categoryName).toBe("Networking");
		expect(page.reportEmail).toBeTruthy();
		expect(JSON.parse(page.article.body)).toMatchObject({
			root: expect.objectContaining({ children: expect.any(Array) }),
		});
	});

	it("uses the explicit excerpt when present", async () => {
		const created = await createArticleAction(
			input({ excerpt: "A real excerpt." }),
		);
		await publishArticleAction(created.id);

		const page = await getPublicArticleAction("networking", "guide");

		if (page.notFound) {
			throw new Error("Expected article to be found");
		}

		expect(page.article.summary).toBe("A real excerpt.");
	});

	it("returns notFound for a draft article", async () => {
		await createArticleAction(input());

		const page = await getPublicArticleAction("networking", "guide");

		expect(page.notFound).toBe(true);
	});

	it("returns notFound for an archived article", async () => {
		const created = await createArticleAction(input());
		await publishArticleAction(created.id);
		await archiveArticleAction(created.id);

		const page = await getPublicArticleAction("networking", "guide");

		expect(page.notFound).toBe(true);
	});

	it("returns notFound for an unknown slug", async () => {
		const page = await getPublicArticleAction("networking", "nope");

		expect(page.notFound).toBe(true);
	});

	it("returns notFound when the category slug does not match", async () => {
		const created = await createArticleAction(input());
		await publishArticleAction(created.id);

		const page = await getPublicArticleAction("printing", "guide");

		expect(page.notFound).toBe(true);
	});

	it("lists related published articles from the same category", async () => {
		const a = await createArticleAction(input({ title: "A", slug: "a" }));
		const b = await createArticleAction(input({ title: "B", slug: "b" }));
		const c = await createArticleAction(input({ title: "C", slug: "c" }));
		await createArticleAction(
			input({ title: "Draft", slug: "draft", body: undefined }),
		);
		await publishArticleAction(a.id);
		await publishArticleAction(b.id);
		await publishArticleAction(c.id);

		const page = await getPublicArticleAction("networking", "a");

		if (page.notFound) {
			throw new Error("Expected article to be found");
		}

		expect(page.related.map((item) => item.slug)).toEqual(["c", "b"]);
		expect(page.related.map((item) => item.categorySlug)).toEqual([
			"networking",
			"networking",
		]);
	});
});
