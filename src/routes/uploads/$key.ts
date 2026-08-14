import { createFileRoute } from "@tanstack/react-router";

import { storage } from "#/lib/storage";
import { contentTypeForKey } from "#/lib/uploads";

const uploadKeyPattern = /^[0-9a-f]{32}\.(?:jpg|png|gif|webp|svg)$/;

export const Route = createFileRoute("/uploads/$key")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				if (!uploadKeyPattern.test(params.key)) {
					return new Response("Not found", { status: 404 });
				}

				try {
					const data = await storage.read(params.key);
					const contentType = contentTypeForKey(params.key);
					const body = new Uint8Array(data.byteLength);
					body.set(data);
					const headers = new Headers({
						"Content-Type": contentType,
						"X-Content-Type-Options": "nosniff",
						"Cache-Control": "public, max-age=31536000, immutable",
					});

					if (contentType === "image/svg+xml") {
						headers.set(
							"Content-Security-Policy",
							"default-src 'none'; sandbox",
						);
					}

					return new Response(new Blob([body]), { status: 200, headers });
				} catch {
					return new Response("Not found", { status: 404 });
				}
			},
		},
	},
});
