import { createServerFn } from "@tanstack/react-start";

import {
	approveDocumentAction,
	archiveDocumentAction,
	type DocumentItem,
	deleteDocumentAction,
	getDocumentAction,
	listDocumentsAction,
	restoreDocumentAction,
	updateDocumentAction,
	uploadDocumentAction,
} from "#/lib/documents";
import {
	documentIdSchema,
	documentUpdateSchema,
	documentUploadSchema,
} from "#/lib/schemas/documents";

import { requirePermission } from "./guard";

export const getDocuments = createServerFn({
	method: "GET",
}).handler(async (): Promise<DocumentItem[]> => {
	await requirePermission({ documents: ["view"] });

	return listDocumentsAction();
});

export const getDocument = createServerFn({
	method: "GET",
})
	.validator(documentIdSchema)
	.handler(async ({ data }): Promise<DocumentItem> => {
		await requirePermission({ documents: ["view"] });

		return getDocumentAction(data.id);
	});

export const uploadDocument = createServerFn({
	method: "POST",
})
	.validator(documentUploadSchema)
	.handler(async ({ data }): Promise<DocumentItem> => {
		await requirePermission({ documents: ["create"] });

		return uploadDocumentAction(data);
	});

export const updateDocument = createServerFn({
	method: "POST",
})
	.validator(documentUpdateSchema)
	.handler(async ({ data }): Promise<DocumentItem> => {
		await requirePermission({ documents: ["update"] });

		return updateDocumentAction(data.id, data);
	});

export const approveDocument = createServerFn({
	method: "POST",
})
	.validator(documentIdSchema)
	.handler(async ({ data }): Promise<DocumentItem> => {
		await requirePermission({ documents: ["approve"] });

		return approveDocumentAction(data.id);
	});

export const archiveDocument = createServerFn({
	method: "POST",
})
	.validator(documentIdSchema)
	.handler(async ({ data }): Promise<DocumentItem> => {
		await requirePermission({ documents: ["archive"] });

		return archiveDocumentAction(data.id);
	});

export const restoreDocument = createServerFn({
	method: "POST",
})
	.validator(documentIdSchema)
	.handler(async ({ data }): Promise<DocumentItem> => {
		await requirePermission({ documents: ["restore"] });

		return restoreDocumentAction(data.id);
	});

export const deleteDocument = createServerFn({
	method: "POST",
})
	.validator(documentIdSchema)
	.handler(async ({ data }): Promise<{ ok: true }> => {
		await requirePermission({ documents: ["delete"] });

		await deleteDocumentAction(data.id);

		return { ok: true };
	});
