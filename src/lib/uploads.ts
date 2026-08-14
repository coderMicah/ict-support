import { randomBytes } from "node:crypto";

import { AppError } from "#/lib/errors";
import { imageUploadSchema } from "#/lib/schemas/uploads";
import { type Storage, storage } from "#/lib/storage";

export const maxImageBytes = 5 * 1024 * 1024;

const imageContentTypes: Record<string, string> = {
	jpg: "image/jpeg",
	png: "image/png",
	gif: "image/gif",
	webp: "image/webp",
	svg: "image/svg+xml",
};

export function isAllowedImageExtension(extension: string): boolean {
	return extension in imageContentTypes;
}

export function contentTypeForKey(key: string): string {
	const extension = key.split(".").pop()?.toLowerCase() ?? "";

	return imageContentTypes[extension] ?? "application/octet-stream";
}

function extensionOf(filename: string): string {
	return filename.split(".").pop()?.toLowerCase() ?? "";
}

export type UploadedImage = {
	key: string;
	url: string;
	contentType: string;
	size: number;
};

export async function uploadImageAction(
	input: unknown,
	uploadStorage: Storage = storage,
): Promise<UploadedImage> {
	const data = imageUploadSchema.parse(input);

	const extension = extensionOf(data.filename);
	if (!isAllowedImageExtension(extension)) {
		throw new AppError(
			`File type not allowed. Allowed image types: ${Object.keys(imageContentTypes).join(", ")}.`,
			"INVALID_FILE_TYPE",
			400,
		);
	}

	const bytes = Buffer.from(data.data, "base64");
	if (bytes.byteLength > maxImageBytes) {
		throw new AppError(
			"Image is too large. The maximum size is 5 MB.",
			"FILE_TOO_LARGE",
			400,
		);
	}

	const key = `${randomBytes(16).toString("hex")}.${extension}`;
	await uploadStorage.save(key, bytes);

	return {
		key,
		url: `/uploads/${key}`,
		contentType: contentTypeForKey(key),
		size: bytes.byteLength,
	};
}
