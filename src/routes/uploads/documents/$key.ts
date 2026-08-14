import { createFileRoute } from "@tanstack/react-router";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "#/db";
import { documents } from "#/db/schema";
import { documentKeyPattern } from "#/lib/documents";
import { storage } from "#/lib/storage";

export const Route = createFileRoute("/uploads/documents/$key")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				if (!documentKeyPattern.test(params.key)) {
					return new Response("Not found", { status: 404 });
				}

				const [row] = await db
					.select({
						originalName: documents.originalName,
						contentType: documents.contentType,
					})
					.from(documents)
					.where(
						and(
							eq(documents.fileKey, params.key),
							eq(documents.state, "approved"),
							isNull(documents.deletedAt),
						),
					);

				if (!row) {
					return new Response("Not found", { status: 404 });
				}

				try {
					const data = await storage.read(params.key);
					const body = new Uint8Array(data.byteLength);
					body.set(data);
					const disposition = `attachment; filename="download"; filename*=UTF-8''${encodeURIComponent(row.originalName)}`;
					const headers = new Headers({
						"Content-Type": row.contentType,
						"Content-Disposition": disposition,
						"X-Content-Type-Options": "nosniff",
						"Cache-Control": "public, max-age=3600",
					});

					return new Response(new Blob([body]), { status: 200, headers });
				} catch {
					return new Response("Not found", { status: 404 });
				}
			},
		},
	},
});
