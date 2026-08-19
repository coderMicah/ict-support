import { createServerFn } from "@tanstack/react-start";

import { imageUploadSchema } from "#/lib/schemas/uploads";
import { type UploadedImage, uploadImageAction } from "#/lib/uploads";

import { requirePermission } from "./guard";

export const uploadImage = createServerFn({ method: "POST" })
	.validator(imageUploadSchema)
	.handler(async ({ data }): Promise<UploadedImage> => {
		await requirePermission({ uploads: ["create"] });

		return uploadImageAction(data);
	});
