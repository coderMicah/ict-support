export function getPgError(
	error: unknown,
): { code?: string; message?: string } | undefined {
	let current: unknown = error;

	while (
		current &&
		typeof current === "object" &&
		"cause" in current &&
		current.cause !== current
	) {
		current = (current as { cause: unknown }).cause;
	}

	if (current && typeof current === "object" && "code" in current) {
		return current as { code?: string; message?: string };
	}

	return undefined;
}

export function isDuplicateSlug(error: unknown): boolean {
	const pgError = getPgError(error);

	return (
		pgError?.code === "23505" && pgError.message?.includes("slug") === true
	);
}
