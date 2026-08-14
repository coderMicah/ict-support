import { randomBytes } from "node:crypto";

import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "#/db";
import { categories, documents } from "#/db/schema";
import { AppError } from "#/lib/errors";
import {
	documentInputSchema,
	documentUploadSchema,
} from "#/lib/schemas/documents";
import { type Storage, storage } from "#/lib/storage";

export const maxDocumentBytes = 20 * 1024 * 1024;

const documentContentTypes: Record<string, string> = {
	pdf: "application/pdf",
	doc: "application/msword",
	docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	xls: "application/vnd.ms-excel",
	xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	ppt: "application/vnd.ms-powerpoint",
	pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
	odt: "application/vnd.oasis.opendocument.text",
	ods: "application/vnd.oasis.opendocument.spreadsheet",
	odp: "application/vnd.oasis.opendocument.presentation",
};

export const documentKeyPattern =
	/^[0-9a-f]{32}\.(?:pdf|doc|docx|xls|xlsx|ppt|pptx|odt|ods|odp)$/;

export function isAllowedDocumentExtension(extension: string): boolean {
	return extension in documentContentTypes;
}

export function documentContentTypeForKey(key: string): string {
	const extension = key.split(".").pop()?.toLowerCase() ?? "";

	return documentContentTypes[extension] ?? "application/octet-stream";
}

export type DocumentState = "pending" | "approved" | "archived";

export const documentStates: readonly DocumentState[] = [
	"pending",
	"approved",
	"archived",
];

export type DocumentItem = {
	id: number;
	title: string;
	categoryId: number | null;
	categoryName: string | null;
	categorySlug: string | null;
	fileKey: string;
	originalName: string;
	contentType: string;
	size: number;
	state: DocumentState;
	createdAt: string;
	updatedAt: string;
};

type DocumentRow = {
	id: number;
	title: string;
	categoryId: number | null;
	categoryName: string | null;
	categorySlug: string | null;
	fileKey: string;
	originalName: string;
	contentType: string;
	size: number;
	state: string;
	createdAt: Date;
	updatedAt: Date;
};

const selectDocumentRow = {
	id: documents.id,
	title: documents.title,
	categoryId: documents.categoryId,
	categoryName: categories.name,
	categorySlug: categories.slug,
	fileKey: documents.fileKey,
	originalName: documents.originalName,
	contentType: documents.contentType,
	size: documents.size,
	state: documents.state,
	createdAt: documents.createdAt,
	updatedAt: documents.updatedAt,
};

function toDocumentItem(row: DocumentRow): DocumentItem {
	return {
		id: row.id,
		title: row.title,
		categoryId: row.categoryId,
		categoryName: row.categoryName,
		categorySlug: row.categorySlug,
		fileKey: row.fileKey,
		originalName: row.originalName,
		contentType: row.contentType,
		size: row.size,
		state: row.state as DocumentState,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

export type PublicDocumentItem = {
	id: number;
	title: string;
	categoryName: string | null;
	originalName: string;
	contentType: string;
	size: number;
	url: string;
	updatedAt: string;
};

function toPublicDocumentItem(row: DocumentRow): PublicDocumentItem {
	return {
		id: row.id,
		title: row.title,
		categoryName: row.categoryName,
		originalName: row.originalName,
		contentType: row.contentType,
		size: row.size,
		url: `/uploads/documents/${row.fileKey}`,
		updatedAt: row.updatedAt.toISOString(),
	};
}

function extensionOf(filename: string): string {
	return filename.split(".").pop()?.toLowerCase() ?? "";
}

async function assertCategoryExists(categoryId: number): Promise<void> {
	const [row] = await db
		.select({ id: categories.id })
		.from(categories)
		.where(eq(categories.id, categoryId));

	if (!row) {
		throw new AppError(
			"The selected category does not exist.",
			"INVALID_CATEGORY",
			400,
		);
	}
}

async function getDocumentRowById(
	id: number,
): Promise<DocumentRow | undefined> {
	const [row] = await db
		.select(selectDocumentRow)
		.from(documents)
		.leftJoin(categories, eq(documents.categoryId, categories.id))
		.where(and(eq(documents.id, id), isNull(documents.deletedAt)));

	return row;
}

export async function listDocumentsAction(): Promise<DocumentItem[]> {
	const rows = await db
		.select(selectDocumentRow)
		.from(documents)
		.leftJoin(categories, eq(documents.categoryId, categories.id))
		.where(isNull(documents.deletedAt))
		.orderBy(desc(documents.updatedAt));

	return rows.map(toDocumentItem);
}

export async function listApprovedDocumentsAction(): Promise<
	PublicDocumentItem[]
> {
	const rows = await db
		.select(selectDocumentRow)
		.from(documents)
		.leftJoin(categories, eq(documents.categoryId, categories.id))
		.where(and(eq(documents.state, "approved"), isNull(documents.deletedAt)))
		.orderBy(desc(documents.updatedAt));

	return rows.map(toPublicDocumentItem);
}

export async function getDocumentAction(id: number): Promise<DocumentItem> {
	const row = await getDocumentRowById(id);

	if (!row) {
		throw new AppError("Document not found.", "NOT_FOUND", 404);
	}

	return toDocumentItem(row);
}

export async function uploadDocumentAction(
	input: unknown,
	uploadStorage: Storage = storage,
): Promise<DocumentItem> {
	const data = documentUploadSchema.parse(input);

	const extension = extensionOf(data.filename);
	if (!isAllowedDocumentExtension(extension)) {
		throw new AppError(
			`File type not allowed. Allowed file types: ${Object.keys(documentContentTypes).join(", ")}.`,
			"INVALID_FILE_TYPE",
			400,
		);
	}

	const bytes = Buffer.from(data.data, "base64");
	if (bytes.byteLength > maxDocumentBytes) {
		throw new AppError(
			"File is too large. The maximum size is 20 MB.",
			"FILE_TOO_LARGE",
			400,
		);
	}

	if (data.categoryId != null) {
		await assertCategoryExists(data.categoryId);
	}

	const key = `${randomBytes(16).toString("hex")}.${extension}`;
	await uploadStorage.save(key, bytes);

	const [row] = await db
		.insert(documents)
		.values({
			title: data.title,
			fileKey: key,
			originalName: data.filename,
			contentType: documentContentTypeForKey(key),
			size: bytes.byteLength,
			state: "pending",
			categoryId: data.categoryId ?? null,
		})
		.returning({ id: documents.id });

	return await getDocumentAction(row.id);
}

const documentTransitions: Record<
	DocumentState,
	{ target: DocumentState; verb: string }
> = {
	pending: { target: "approved", verb: "approve" },
	approved: { target: "archived", verb: "archive" },
	archived: { target: "approved", verb: "restore" },
};

function assertLegalTransition(
	current: string,
	transition: keyof typeof documentTransitions,
): void {
	if (current !== transition) {
		throw new AppError(
			`A document in the "${current}" state cannot be ${documentTransitions[transition].verb}ed.`,
			"ILLEGAL_STATE_TRANSITION",
			409,
		);
	}
}

async function setDocumentState(
	id: number,
	transition: keyof typeof documentTransitions,
): Promise<DocumentItem> {
	const row = await getDocumentRowById(id);

	if (!row) {
		throw new AppError("Document not found.", "NOT_FOUND", 404);
	}

	assertLegalTransition(row.state, transition);

	await db
		.update(documents)
		.set({ state: documentTransitions[transition].target })
		.where(and(eq(documents.id, id), isNull(documents.deletedAt)));

	return await getDocumentAction(id);
}

export async function approveDocumentAction(id: number): Promise<DocumentItem> {
	return setDocumentState(id, "pending");
}

export async function archiveDocumentAction(id: number): Promise<DocumentItem> {
	return setDocumentState(id, "approved");
}

export async function restoreDocumentAction(id: number): Promise<DocumentItem> {
	return setDocumentState(id, "archived");
}

export async function deleteDocumentAction(
	id: number,
	uploadStorage: Storage = storage,
): Promise<void> {
	const [row] = await db
		.delete(documents)
		.where(and(eq(documents.id, id), isNull(documents.deletedAt)))
		.returning({ id: documents.id, fileKey: documents.fileKey });

	if (!row) {
		throw new AppError("Document not found.", "NOT_FOUND", 404);
	}

	await uploadStorage.remove?.(row.fileKey);
}

export async function updateDocumentAction(
	id: number,
	input: unknown,
): Promise<DocumentItem> {
	const data = documentInputSchema.parse(input);

	const row = await getDocumentRowById(id);

	if (!row) {
		throw new AppError("Document not found.", "NOT_FOUND", 404);
	}

	if (row.state === "archived") {
		throw new AppError(
			"An archived document cannot be edited.",
			"ILLEGAL_STATE_TRANSITION",
			409,
		);
	}

	if (data.categoryId != null) {
		await assertCategoryExists(data.categoryId);
	}

	await db
		.update(documents)
		.set({
			title: data.title,
			categoryId: data.categoryId ?? null,
		})
		.where(and(eq(documents.id, id), isNull(documents.deletedAt)));

	return await getDocumentAction(id);
}
