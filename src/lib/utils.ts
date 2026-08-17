export const inputClass =
	"w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none";

export function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export function formatSize(bytes: number): string {
	if (bytes < 1024) {
		return `${bytes} B`;
	}
	if (bytes < 1024 * 1024) {
		return `${Math.round(bytes / 1024)} KB`;
	}
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function readFileAsBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result;
			if (typeof result === "string") {
				const base64 = result.split(",")[1];
				if (base64) {
					resolve(base64);
				} else {
					reject(new Error("Could not read the selected file."));
				}
			} else {
				reject(new Error("Could not read the selected file."));
			}
		};
		reader.onerror = () => {
			reject(reader.error ?? new Error("Could not read the selected file."));
		};
		reader.readAsDataURL(file);
	});
}
