export class AppError extends Error {
	code: string;
	statusCode: number;

	constructor(message: string, code = "INTERNAL_ERROR", statusCode = 500) {
		super(message);

		this.name = "AppError";
		this.code = code;
		this.statusCode = statusCode;
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = "You must be signed in to perform this action.") {
		super(message, "UNAUTHORIZED", 401);
	}
}

export class ForbiddenError extends AppError {
	constructor(message = "You do not have permission to perform this action.") {
		super(message, "FORBIDDEN", 403);
	}
}

export function getErrorMessage(
	error: unknown,
	fallback = "Something went wrong. Please try again.",
): string {
	if (typeof error === "string") {
		return error.trim() || fallback;
	}

	if (!error) {
		return fallback;
	}

	const issues = (error as { issues?: Array<{ message?: unknown }> }).issues;
	if (Array.isArray(issues)) {
		const messages = issues
			.map((issue) => issue.message)
			.filter(
				(message): message is string =>
					typeof message === "string" && message.length > 0,
			);

		if (messages.length > 0) {
			return messages.join(" ");
		}

		return fallback;
	}

	if (error instanceof Error) {
		return error.message.trim() || fallback;
	}

	const message = (error as { message?: unknown }).message;
	if (typeof message === "string" && message.trim()) {
		return message.trim();
	}

	return fallback;
}
