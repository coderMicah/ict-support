import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "#/db";
import { documents } from "#/db/schema";
import { createCategoryAction } from "#/lib/categories";
import {
	approveDocumentAction,
	archiveDocumentAction,
	deleteDocumentAction,
	documentContentTypeForKey,
	documentKeyPattern,
	getDocumentAction,
	isAllowedDocumentExtension,
	listApprovedDocumentsAction,
	listDocumentsAction,
	maxDocumentBytes,
	restoreDocumentAction,
	updateDocumentAction,
	uploadDocumentAction,
} from "#/lib/documents";
import type { Storage } from "#/lib/storage";

class FakeStorage implements Storage {
	files = new Map<string, Uint8Array>();
	removedKeys: string[] = [];

	async save(key: string, data: Uint8Array): Promise<void> {
		this.files.set(key, data);
	}

	async read(key: string): Promise<Uint8Array> {
		const data = this.files.get(key);

		if (!data) {
			throw new Error(`Missing file: ${key}`);
		}

		return data;
	}

	async remove(key: string): Promise<void> {
		this.files.delete(key);
		this.removedKeys.push(key);
	}
}

const tinyFile = new Uint8Array([
	0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34,
]);

function base64(bytes: Uint8Array): string {
	return Buffer.from(bytes).toString("base64");
}

let categoryId: number | null = null;

beforeEach(async () => {
	await db.execute(sql`TRUNCATE TABLE categories RESTART IDENTITY CASCADE`);

	const category = await createCategoryAction({
		name: "Forms",
		slug: "forms",
		sortOrder: 0,
	});
	categoryId = category.id;
});

const uploadInput = (overrides: Record<string, unknown> = {}) => ({
	title: "Equipment request form",
	categoryId,
	filename: "equipment-request.pdf",
	data: base64(tinyFile),
	...overrides,
});

describe("uploadDocumentAction", () => {
	it("stores an allowed file as a pending document", async () => {
		const uploadStorage = new FakeStorage();

		const document = await uploadDocumentAction(uploadInput(), uploadStorage);

		expect(document.id).toBeGreaterThan(0);
		expect(document.title).toBe("Equipment request form");
		expect(document.categoryId).toBe(categoryId);
		expect(document.categoryName).toBe("Forms");
		expect(document.fileKey).toMatch(/^[0-9a-f]{32}\.pdf$/);
		expect(document.originalName).toBe("equipment-request.pdf");
		expect(document.contentType).toBe("application/pdf");
		expect(document.size).toBe(tinyFile.byteLength);
		expect(document.state).toBe("pending");
		expect(uploadStorage.files.has(document.fileKey)).toBe(true);
	});

	it("accepts every allowed extension regardless of case", async () => {
		for (const filename of [
			"doc.pdf",
			"doc.doc",
			"doc.docx",
			"sheet.xls",
			"sheet.xlsx",
			"deck.ppt",
			"deck.pptx",
			"text.odt",
			"sheet.ods",
			"deck.odp",
			"DOC.PDF",
		]) {
			const uploadStorage = new FakeStorage();
			const document = await uploadDocumentAction(
				uploadInput({ filename, title: filename }),
				uploadStorage,
			);

			expect(uploadStorage.files.has(document.fileKey)).toBe(true);
		}
	});

	it("rejects disallowed file types with a clear error", async () => {
		for (const filename of [
			"virus.exe",
			"script.sh",
			"image.png",
			"photo.jpg.exe",
			"README",
		]) {
			await expect(
				uploadDocumentAction(uploadInput({ filename }), new FakeStorage()),
			).rejects.toMatchObject({ code: "INVALID_FILE_TYPE", statusCode: 400 });
		}
	});

	it("rejects files over the 20 MB cap", async () => {
		const tooLarge = new Uint8Array(maxDocumentBytes + 1);

		await expect(
			uploadDocumentAction(
				uploadInput({ data: base64(tooLarge) }),
				new FakeStorage(),
			),
		).rejects.toMatchObject({ code: "FILE_TOO_LARGE", statusCode: 400 });
	});

	it("accepts files exactly at the 20 MB cap", async () => {
		const atCap = new Uint8Array(maxDocumentBytes);

		const document = await uploadDocumentAction(
			uploadInput({ data: base64(atCap) }),
			new FakeStorage(),
		);

		expect(document.size).toBe(maxDocumentBytes);
	});

	it("rejects an unknown category", async () => {
		await expect(
			uploadDocumentAction(uploadInput({ categoryId: 9999 }), new FakeStorage()),
		).rejects.toMatchObject({ code: "INVALID_CATEGORY" });
	});

	it("allows a document without a category", async () => {
		const document = await uploadDocumentAction(
			uploadInput({ categoryId: null }),
			new FakeStorage(),
		);

		expect(document.categoryId).toBeNull();
		expect(document.categoryName).toBeNull();
	});

	it("never uses the original filename as the storage key", async () => {
		const uploadStorage = new FakeStorage();

		const document = await uploadDocumentAction(
			uploadInput({ filename: "../../etc/passwd.pdf" }),
			uploadStorage,
		);

		expect(document.fileKey).toMatch(/^[0-9a-f]{32}\.pdf$/);
		expect(uploadStorage.files.has("../../etc/passwd.pdf")).toBe(false);
	});
});

describe("listDocumentsAction", () => {
	it("returns non-deleted documents ordered by most recently updated", async () => {
		const first = await uploadDocumentAction(
			uploadInput({ title: "First", filename: "first.pdf" }),
			new FakeStorage(),
		);
		await uploadDocumentAction(
			uploadInput({ title: "Second", filename: "second.pdf" }),
			new FakeStorage(),
		);

		const rows = await listDocumentsAction();

		expect(rows).toHaveLength(2);
		expect(rows.map((row) => row.title)).toEqual(["Second", "First"]);

		await db
			.update(documents)
			.set({ deletedAt: new Date() })
			.where(sql`id = ${first.id}`);

		const remaining = await listDocumentsAction();

		expect(remaining.map((row) => row.title)).toEqual(["Second"]);
	});
});

describe("listApprovedDocumentsAction", () => {
	it("returns only approved, non-deleted documents with public URLs", async () => {
		const pending = await uploadDocumentAction(
			uploadInput({ title: "Pending", filename: "pending.pdf" }),
			new FakeStorage(),
		);
		const approved = await uploadDocumentAction(
			uploadInput({ title: "Approved", filename: "approved.pdf" }),
			new FakeStorage(),
		);
		await approveDocumentAction(approved.id);

		await db
			.update(documents)
			.set({ deletedAt: new Date() })
			.where(sql`id = ${pending.id}`);

		const rows = await listApprovedDocumentsAction();

		expect(rows).toHaveLength(1);
		expect(rows[0].title).toBe("Approved");
		expect(rows[0].url).toBe(`/uploads/documents/${approved.fileKey}`);
	});
});

describe("getDocumentAction", () => {
	it("returns an existing document", async () => {
		const created = await uploadDocumentAction(uploadInput(), new FakeStorage());

		const document = await getDocumentAction(created.id);

		expect(document.id).toBe(created.id);
		expect(document.title).toBe("Equipment request form");
	});

	it("throws NOT_FOUND for a missing document", async () => {
		await expect(getDocumentAction(9999)).rejects.toMatchObject({
			code: "NOT_FOUND",
		});
	});
});

describe("updateDocumentAction", () => {
	it("updates a document and keeps its state unchanged", async () => {
		const created = await uploadDocumentAction(uploadInput(), new FakeStorage());

		await db
			.update(documents)
			.set({ state: "approved" })
			.where(sql`id = ${created.id}`);

		const updated = await updateDocumentAction(
			created.id,
			uploadInput({ title: "Renamed", categoryId: null }),
		);

		expect(updated.title).toBe("Renamed");
		expect(updated.categoryId).toBeNull();
		expect(updated.state).toBe("approved");
		expect(updated.createdAt).toBe(created.createdAt);
	});

	it("rejects editing an archived document", async () => {
		const created = await uploadDocumentAction(uploadInput(), new FakeStorage());
		await approveDocumentAction(created.id);
		await archiveDocumentAction(created.id);

		await expect(
			updateDocumentAction(
				created.id,
				uploadInput({ title: "Renamed" }),
			),
		).rejects.toMatchObject({ code: "ILLEGAL_STATE_TRANSITION" });
	});

	it("rejects an unknown category on update", async () => {
		const created = await uploadDocumentAction(uploadInput(), new FakeStorage());

		await expect(
			updateDocumentAction(created.id, uploadInput({ categoryId: 9999 })),
		).rejects.toMatchObject({ code: "INVALID_CATEGORY" });
	});

	it("throws NOT_FOUND for a missing document", async () => {
		await expect(
			updateDocumentAction(9999, uploadInput()),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});
});

describe("approveDocumentAction", () => {
	it("approves a pending document", async () => {
		const created = await uploadDocumentAction(uploadInput(), new FakeStorage());

		const approved = await approveDocumentAction(created.id);

		expect(approved.state).toBe("approved");
	});

	it("rejects approving an already approved document", async () => {
		const created = await uploadDocumentAction(uploadInput(), new FakeStorage());
		await approveDocumentAction(created.id);

		await expect(approveDocumentAction(created.id)).rejects.toMatchObject({
			code: "ILLEGAL_STATE_TRANSITION",
		});
	});

	it("rejects approving an archived document", async () => {
		const created = await uploadDocumentAction(uploadInput(), new FakeStorage());
		await approveDocumentAction(created.id);
		await archiveDocumentAction(created.id);

		await expect(approveDocumentAction(created.id)).rejects.toMatchObject({
			code: "ILLEGAL_STATE_TRANSITION",
		});
	});

	it("throws NOT_FOUND for a missing document", async () => {
		await expect(approveDocumentAction(9999)).rejects.toMatchObject({
			code: "NOT_FOUND",
		});
	});
});

describe("archiveDocumentAction", () => {
	it("archives an approved document", async () => {
		const created = await uploadDocumentAction(uploadInput(), new FakeStorage());
		await approveDocumentAction(created.id);

		const archived = await archiveDocumentAction(created.id);

		expect(archived.state).toBe("archived");
	});

	it("rejects archiving a pending document", async () => {
		const created = await uploadDocumentAction(uploadInput(), new FakeStorage());

		await expect(archiveDocumentAction(created.id)).rejects.toMatchObject({
			code: "ILLEGAL_STATE_TRANSITION",
		});
	});
});

describe("restoreDocumentAction", () => {
	it("restores an archived document to approved", async () => {
		const created = await uploadDocumentAction(uploadInput(), new FakeStorage());
		await approveDocumentAction(created.id);
		await archiveDocumentAction(created.id);

		const restored = await restoreDocumentAction(created.id);

		expect(restored.state).toBe("approved");
	});

	it("rejects restoring a pending document", async () => {
		const created = await uploadDocumentAction(uploadInput(), new FakeStorage());

		await expect(restoreDocumentAction(created.id)).rejects.toMatchObject({
			code: "ILLEGAL_STATE_TRANSITION",
		});
	});
});

describe("deleteDocumentAction", () => {
	it("permanently deletes a document and its file from any state", async () => {
		const uploadStorage = new FakeStorage();
		const pending = await uploadDocumentAction(uploadInput(), uploadStorage);
		const approved = await uploadDocumentAction(
			uploadInput({ title: "Approved", filename: "approved.pdf" }),
			uploadStorage,
		);
		await approveDocumentAction(approved.id);

		await deleteDocumentAction(pending.id, uploadStorage);
		await deleteDocumentAction(approved.id, uploadStorage);

		await expect(getDocumentAction(pending.id)).rejects.toMatchObject({
			code: "NOT_FOUND",
		});
		await expect(getDocumentAction(approved.id)).rejects.toMatchObject({
			code: "NOT_FOUND",
		});
		expect(uploadStorage.removedKeys).toEqual(
			expect.arrayContaining([pending.fileKey, approved.fileKey]),
		);
		expect(uploadStorage.files.has(pending.fileKey)).toBe(false);
		await expect(listDocumentsAction()).resolves.toHaveLength(0);
	});

	it("throws NOT_FOUND for a missing document", async () => {
		await expect(deleteDocumentAction(9999)).rejects.toMatchObject({
			code: "NOT_FOUND",
		});
	});
});

describe("document file helpers", () => {
	it("allows only the configured document extensions", () => {
		for (const extension of [
			"pdf",
			"doc",
			"docx",
			"xls",
			"xlsx",
			"ppt",
			"pptx",
			"odt",
			"ods",
			"odp",
		]) {
			expect(isAllowedDocumentExtension(extension)).toBe(true);
		}

		expect(isAllowedDocumentExtension("exe")).toBe(false);
		expect(isAllowedDocumentExtension("jpg")).toBe(false);
	});

	it("maps known extensions to their content type", () => {
		expect(documentContentTypeForKey("a.pdf")).toBe("application/pdf");
		expect(documentContentTypeForKey("a.docx")).toBe(
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		);
		expect(documentContentTypeForKey("a.bin")).toBe("application/octet-stream");
	});

	it("matches only safe random-key document keys", () => {
		expect(documentKeyPattern.test("ab1234cd90123456ef7890ab1234cd90.pdf")).toBe(
			true,
		);
		expect(documentKeyPattern.test("short.pdf")).toBe(false);
		expect(documentKeyPattern.test("../../etc/passwd.pdf")).toBe(false);
		expect(documentKeyPattern.test(`${"a".repeat(32)}.exe`)).toBe(false);
		expect(documentKeyPattern.test(`${"a".repeat(32)}.png`)).toBe(false);
	});
});
