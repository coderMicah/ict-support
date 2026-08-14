import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "#/db";
import {
	archiveArticleAction,
	createArticleAction,
	publishArticleAction,
} from "#/lib/articles";
import { createCategoryAction } from "#/lib/categories";
import { createContactAction } from "#/lib/contacts";
import {
	approveDocumentAction,
	archiveDocumentAction,
	uploadDocumentAction,
} from "#/lib/documents";
import { emptySearchResult, searchAction } from "#/lib/search";
import type { Storage } from "#/lib/storage";

const tinyFile = new Uint8Array([
	0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34,
]);

function base64(bytes: Uint8Array): string {
	return Buffer.from(bytes).toString("base64");
}

function bodyWithText(text: string): string {
	return JSON.stringify({
		root: {
			children: [
				{
					type: "paragraph",
					version: 1,
					children: [{ type: "text", version: 1, text }],
				},
			],
			direction: null,
			format: "",
			indent: 0,
			version: 1,
		},
	});
}

let categoryId = 0;

beforeEach(async () => {
	await db.execute(sql`TRUNCATE TABLE contacts RESTART IDENTITY CASCADE`);
	await db.execute(sql`TRUNCATE TABLE categories RESTART IDENTITY CASCADE`);

	const category = await createCategoryAction({
		name: "Support",
		slug: "support",
		sortOrder: 0,
	});
	categoryId = category.id;
});

async function createArticle(
	title: string,
	slug: string,
	text: string,
	state: "draft" | "published" | "archived",
) {
	const article = await createArticleAction({
		title,
		slug,
		categoryId,
		body: bodyWithText(text),
	});

	if (state === "published") {
		return publishArticleAction(article.id);
	}

	if (state === "archived") {
		await publishArticleAction(article.id);

		return archiveArticleAction(article.id);
	}

	return article;
}

class FakeStorage implements Storage {
	async save(): Promise<void> {}

	async read(): Promise<Uint8Array> {
		return tinyFile;
	}

	async remove(): Promise<void> {}
}

async function createDocument(
	title: string,
	state: "pending" | "approved" | "archived",
) {
	const document = await uploadDocumentAction(
		{
			title,
			categoryId,
			filename: `${title}.pdf`,
			data: base64(tinyFile),
		},
		new FakeStorage(),
	);

	if (state === "approved") {
		return approveDocumentAction(document.id);
	}

	if (state === "archived") {
		await approveDocumentAction(document.id);

		return archiveDocumentAction(document.id);
	}

	return document;
}

async function createContact(
	name: string,
	role: string,
	overrides: Record<string, unknown> = {},
) {
	return createContactAction({
		name,
		role,
		phone: "+27 12 345 6789",
		email: "jane.doe@example.gov",
		coverage: "Weekdays, 8am–5pm.",
		sortOrder: 1,
		active: true,
		...overrides,
	});
}

describe("searchAction visibility", () => {
	it("public search returns only published, approved, and active content", async () => {
		await createArticle(
			"Password reset guide",
			"password-reset",
			"Instructions for resetting your password.",
			"published",
		);
		await createArticle(
			"Draft network guide",
			"draft-network",
			"Draft networking notes.",
			"draft",
		);
		await createDocument("Equipment request form", "approved");
		await createDocument("Pending budget template", "pending");
		await createContact("Jane Doe", "ICT Officer");
		await createContact("Former Admin", "Retired", { active: false });

		const articleResults = await searchAction("guide", null);
		expect(articleResults.articles.map((hit) => hit.title)).toEqual([
			"Password reset guide",
		]);
		expect(articleResults.documents).toHaveLength(0);
		expect(articleResults.contacts).toHaveLength(0);

		const documentResults = await searchAction("equipment", null);
		expect(documentResults.documents.map((hit) => hit.title)).toEqual([
			"Equipment request form",
		]);
		expect(documentResults.articles).toHaveLength(0);

		const contactResults = await searchAction("jane", null);
		expect(contactResults.contacts.map((hit) => hit.name)).toEqual([
			"Jane Doe",
		]);
		expect(contactResults.articles).toHaveLength(0);
	});

	it("officer search also surfaces drafts and pending content", async () => {
		await createArticle(
			"Password reset guide",
			"password-reset",
			"Instructions for resetting your password.",
			"published",
		);
		await createArticle(
			"Draft network guide",
			"draft-network",
			"Draft networking notes.",
			"draft",
		);
		await createDocument("Pending budget template", "pending");

		const articleResults = await searchAction("guide", "user");
		expect(articleResults.articles.map((hit) => hit.title).sort()).toEqual([
			"Draft network guide",
			"Password reset guide",
		]);

		const documentResults = await searchAction("budget", "user");
		expect(documentResults.documents.map((hit) => hit.title)).toEqual([
			"Pending budget template",
		]);
	});

	it("admin search includes archived content", async () => {
		await createArticle(
			"Old printer guide",
			"old-printer",
			"Archived printer instructions.",
			"archived",
		);
		await createDocument("Retired travel form", "archived");

		const publicResults = await searchAction("printer", null);
		expect(publicResults.articles).toHaveLength(0);

		const adminResults = await searchAction("printer", "admin");
		expect(adminResults.articles.map((hit) => hit.title)).toEqual([
			"Old printer guide",
		]);

		const adminDocumentResults = await searchAction("travel", "admin");
		expect(adminDocumentResults.documents.map((hit) => hit.title)).toEqual([
			"Retired travel form",
		]);
	});
});

describe("searchAction ranking and grouping", () => {
	it("ranks title matches above body-only matches", async () => {
		await createArticle(
			"Fire safety procedures",
			"fire-safety",
			"Details about fire extinguishers.",
			"published",
		);
		await createArticle(
			"Office handbook",
			"office-handbook",
			"Fire safety is everyone's responsibility.",
			"published",
		);

		const results = await searchAction("fire", null);

		expect(results.articles.map((hit) => hit.slug)).toEqual([
			"fire-safety",
			"office-handbook",
		]);
	});

	it("groups results by content type", async () => {
		await createArticle(
			"Equipment ordering guide",
			"equipment-guide",
			"How to order equipment.",
			"published",
		);
		await createDocument("Equipment request form", "approved");
		await createContact("Equipment Officer", "Procurement", {
			email: "procurement@example.gov",
		});

		const results = await searchAction("equipment", null);

		expect(results.articles.map((hit) => hit.slug)).toEqual([
			"equipment-guide",
		]);
		expect(results.documents.map((hit) => hit.title)).toEqual([
			"Equipment request form",
		]);
		expect(results.contacts.map((hit) => hit.name)).toEqual([
			"Equipment Officer",
		]);
	});

	it("finds contacts by name, role, and contact details", async () => {
		await createContact("Jane Doe", "ICT Officer", {
			email: "jane.doe@example.gov",
			phone: "+27 12 345 6789",
		});

		const byName = await searchAction("doe", null);
		expect(byName.contacts.map((hit) => hit.name)).toEqual(["Jane Doe"]);

		const byRole = await searchAction("officer", null);
		expect(byRole.contacts.map((hit) => hit.name)).toEqual(["Jane Doe"]);

		const byPhone = await searchAction("6789", null);
		expect(byPhone.contacts.map((hit) => hit.name)).toEqual(["Jane Doe"]);
	});
});

describe("searchAction query handling", () => {
	it("returns empty groups for a blank query", async () => {
		await createArticle(
			"Password reset guide",
			"password-reset",
			"Instructions.",
			"published",
		);

		expect(await searchAction("   ", null)).toEqual(emptySearchResult(""));
		expect(await searchAction("", "admin")).toEqual(emptySearchResult(""));
	});
});
