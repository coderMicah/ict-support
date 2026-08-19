import { createServerFn } from "@tanstack/react-start";

import { imageUploadSchema } from "#/lib/schemas/uploads";
import type { UploadedImage } from "#/lib/uploads";

export const uploadImage = createServerFn({ method: "POST" })
	.validator(imageUploadSchema)
	.handler(async ({ data }): Promise<UploadedImage> => {
		const { requirePermission } = await import("./guard");
		const { uploadImageAction } = await import("#/lib/uploads");

		await requirePermission({ uploads: ["create"] });

		return uploadImageAction(data);
	});
