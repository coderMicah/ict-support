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
		throw new UnauthorizedError();
	}

	if (session.user.approved === false) {
		throw new ForbiddenError("Your account is pending admin approval.");
	}

	const user = session.user as {
		banned?: boolean;
		banExpires?: Date | string | null;
	};
	if (user.banned) {
		if (user.banExpires && new Date(user.banExpires) > new Date()) {
			throw new ForbiddenError("Your account has been suspended.");
		}
		if (!user.banExpires) {
			throw new ForbiddenError("Your account has been suspended.");
		}
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

export async function requireAdminSession(): Promise<
	NonNullable<ServerSession>
> {
	return requirePermission({ user: ["list"] });
}
