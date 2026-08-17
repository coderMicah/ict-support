import { can, type Permission } from "#/lib/access-control";
import { getServerSession, type ServerSession } from "#/lib/auth-functions";
import { ForbiddenError, UnauthorizedError } from "#/lib/errors";

export type { ServerSession };
export { getServerSession } from "#/lib/auth-functions";

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

	// Better Auth returns banned/banExpires at runtime but doesn't expose them in its types.
	const user = session.user as Record<string, unknown>;
	if (user.banned) {
		const expires =
			user.banExpires != null ? new Date(user.banExpires as string) : null;
		if (!expires || expires > new Date()) {
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

export async function requireAdminRole(): Promise<NonNullable<ServerSession>> {
	return requirePermission({ user: ["list"] });
}
