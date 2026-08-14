import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Storage seam for uploaded files.
 *
 * Implementations only need to persist and return bytes keyed by a storage
 * key; content types are derived from the key's extension. This keeps the
 * local-disk implementation swappable for S3-compatible storage later.
 */
export interface Storage {
	save(key: string, data: Uint8Array): Promise<void>;
	read(key: string): Promise<Uint8Array>;
}

export class DiskStorage implements Storage {
	constructor(private readonly dir: string) {}

	private resolve(key: string): string {
		if (!/^[a-z0-9]+(?:\.[a-z0-9]+)?$/.test(key)) {
			throw new Error(`Invalid storage key: "${key}"`);
		}

		return path.join(this.dir, key);
	}

	async save(key: string, data: Uint8Array): Promise<void> {
		await mkdir(this.dir, { recursive: true });
		await writeFile(this.resolve(key), data);
	}

	async read(key: string): Promise<Uint8Array> {
		const data = await readFile(this.resolve(key));

		return new Uint8Array(data);
	}
}

export const storage: Storage = new DiskStorage(
	process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads"),
);
