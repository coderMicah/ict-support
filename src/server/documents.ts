import { createServerFn } from "@tanstack/react-start";

import type { DocumentItem } from "#/lib/documents";
import {
	documentIdSchema,
	documentUpdateSchema,
	documentUploadSchema,
} from "#/lib/schemas/documents";

export const getDocuments = createServerFn({
	method: "GET",
}).handler(async (): Promise<DocumentItem[]> => {
	const { requirePermission } = await import("./guard");
	const { listDocumentsAction } = await import("#/lib/documents");

	await requirePermission({ documents: ["view"] });

	return listDocumentsAction();
});

export const getDocument = createServerFn({
	method: "GET",
})
	.validator(documentIdSchema)
	.handler(async ({ data }): Promise<DocumentItem> => {
		const { requirePermission } = await import("./guard");
		const { getDocumentAction } = await import("#/lib/documents");

		await requirePermission({ documents: ["view"] });

		return getDocumentAction(data.id);
	});

export const uploadDocument = createServerFn({
	method: "POST",
})
	.validator(documentUploadSchema)
	.handler(async ({ data }): Promise<DocumentItem> => {
		const { requirePermission } = await import("./guard");
		const { uploadDocumentAction } = await import("#/lib/documents");

		await requirePermission({ documents: ["create"] });

		return uploadDocumentAction(data);
	});

export const updateDocument = createServerFn({
	method: "POST",
})
	.validator(documentUpdateSchema)
	.handler(async ({ data }): Promise<DocumentItem> => {
		const { requirePermission } = await import("./guard");
		const { updateDocumentAction } = await import("#/lib/documents");

		await requirePermission({ documents: ["update"] });

		return updateDocumentAction(data.id, data);
	});

export const approveDocument = createServerFn({
	method: "POST",
})
	.validator(documentIdSchema)
	.handler(async ({ data }): Promise<DocumentItem> => {
		const { requirePermission } = await import("./guard");
		const { approveDocumentAction } = await import("#/lib/documents");

		await requirePermission({ documents: ["approve"] });

		return approveDocumentAction(data.id);
	});

export const archiveDocument = createServerFn({
	method: "POST",
})
	.validator(documentIdSchema)
	.handler(async ({ data }): Promise<DocumentItem> => {
		const { requirePermission } = await import("./guard");
		const { archiveDocumentAction } = await import("#/lib/documents");

		await requirePermission({ documents: ["archive"] });

		return archiveDocumentAction(data.id);
	});

export const restoreDocument = createServerFn({
	method: "POST",
})
	.validator(documentIdSchema)
	.handler(async ({ data }): Promise<DocumentItem> => {
		const { requirePermission } = await import("./guard");
		const { restoreDocumentAction } = await import("#/lib/documents");

		await requirePermission({ documents: ["restore"] });

		return restoreDocumentAction(data.id);
	});

export const deleteDocument = createServerFn({
	method: "POST",
})
	.validator(documentIdSchema)
	.handler(async ({ data }): Promise<{ ok: true }> => {
		const { requirePermission } = await import("./guard");
		const { deleteDocumentAction } = await import("#/lib/documents");

		await requirePermission({ documents: ["delete"] });

		await deleteDocumentAction(data.id);

		return { ok: true };
	});
