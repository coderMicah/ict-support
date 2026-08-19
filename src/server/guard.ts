import { getRequestHeaders } from "@tanstack/react-start/server";

import { can, type Permission } from "#/lib/access-control";
import { auth } from "#/lib/auth";
import { ForbiddenError, UnauthorizedError } from "#/lib/errors";

export type ServerSession = Awaited<ReturnType<typeof auth.api.getSession>>;

export async function getServerSession(): Promise<ServerSession> {
	return await auth.api.getSession({
		headers: getRequestHeaders(),
	});
}

export async function requireServerSession(): Promise<
	NonNullable<ServerSession>
> {
	const session = await getServerSession();

	if (!session) {
		throw new UnauthorizedError(
			"You must be signed in to perform this action.",
		);
	}

	return session;
}

export async function requirePermission(
	permission: Permission,
): Promise<NonNullable<ServerSession>> {
	const session = await requireServerSession();

	if (!can(session.user.role, permission)) {
		throw new ForbiddenError();
	}

	return session;
}

export async function requireAdminRole(): Promise<NonNullable<ServerSession>> {
	const session = await requireServerSession();

	if (session.user.role !== "admin") {
		throw new ForbiddenError("Admin access is required for this action.");
	}

	return session;
}
