import { describe, expect, it } from "vitest";

import type { Storage } from "#/lib/storage";
import {
	contentTypeForKey,
	isAllowedImageExtension,
	maxImageBytes,
	uploadImageAction,
} from "#/lib/uploads";

class FakeStorage implements Storage {
	files = new Map<string, Uint8Array>();

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
}

const tinyImage = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

function base64(bytes: Uint8Array): string {
	return Buffer.from(bytes).toString("base64");
}

describe("uploadImageAction", () => {
	it("stores an allowed image and returns an app-route URL", async () => {
		const uploadStorage = new FakeStorage();

		const result = await uploadImageAction(
			{ filename: "photo.jpg", data: base64(tinyImage) },
			uploadStorage,
		);

		expect(result.key).toMatch(/^[0-9a-f]{32}\.jpg$/);
		expect(result.url).toBe(`/uploads/${result.key}`);
		expect(result.contentType).toBe("image/jpeg");
		expect(result.size).toBe(tinyImage.byteLength);
		expect(uploadStorage.files.has(result.key)).toBe(true);
	});

	it("accepts every allowed extension regardless of case", async () => {
		for (const filename of [
			"photo.jpg",
			"photo.png",
			"photo.gif",
			"photo.webp",
			"photo.svg",
			"PHOTO.JPG",
		]) {
			const uploadStorage = new FakeStorage();
			const result = await uploadImageAction(
				{ filename, data: base64(tinyImage) },
				uploadStorage,
			);

			expect(uploadStorage.files.has(result.key)).toBe(true);
		}
	});

	it("rejects disallowed file types with a clear error", async () => {
		for (const filename of [
			"photo.exe",
			"document.pdf",
			"script.sh",
			"photo.png.exe",
			"README",
		]) {
			await expect(
				uploadImageAction(
					{ filename, data: base64(tinyImage) },
					new FakeStorage(),
				),
			).rejects.toMatchObject({ code: "INVALID_FILE_TYPE", statusCode: 400 });
		}
	});

	it("rejects files over the 5 MB cap", async () => {
		const tooLarge = new Uint8Array(maxImageBytes + 1);

		await expect(
			uploadImageAction(
				{ filename: "big.png", data: base64(tooLarge) },
				new FakeStorage(),
			),
		).rejects.toMatchObject({ code: "FILE_TOO_LARGE", statusCode: 400 });
	});

	it("rejects files exactly at the 5 MB cap", async () => {
		const atCap = new Uint8Array(maxImageBytes);

		const result = await uploadImageAction(
			{ filename: "big.png", data: base64(atCap) },
			new FakeStorage(),
		);

		expect(result.size).toBe(maxImageBytes);
	});

	it("never uses the original filename as the storage key", async () => {
		const uploadStorage = new FakeStorage();

		const result = await uploadImageAction(
			{ filename: "../../etc/passwd.jpg", data: base64(tinyImage) },
			uploadStorage,
		);

		expect(result.key).toMatch(/^[0-9a-f]{32}\.jpg$/);
		expect(uploadStorage.files.has("../../etc/passwd.jpg")).toBe(false);
	});
});

describe("isAllowedImageExtension", () => {
	it("allows only the configured image extensions", () => {
		expect(isAllowedImageExtension("jpg")).toBe(true);
		expect(isAllowedImageExtension("png")).toBe(true);
		expect(isAllowedImageExtension("gif")).toBe(true);
		expect(isAllowedImageExtension("webp")).toBe(true);
		expect(isAllowedImageExtension("svg")).toBe(true);
		expect(isAllowedImageExtension("exe")).toBe(false);
		expect(isAllowedImageExtension("pdf")).toBe(false);
	});
});

describe("contentTypeForKey", () => {
	it("maps known extensions to their content type", () => {
		expect(contentTypeForKey("abc.jpg")).toBe("image/jpeg");
		expect(contentTypeForKey("abc.png")).toBe("image/png");
		expect(contentTypeForKey("abc.gif")).toBe("image/gif");
		expect(contentTypeForKey("abc.webp")).toBe("image/webp");
		expect(contentTypeForKey("abc.svg")).toBe("image/svg+xml");
	});

	it("falls back to octet-stream for unknown extensions", () => {
		expect(contentTypeForKey("abc.bin")).toBe("application/octet-stream");
	});
});
