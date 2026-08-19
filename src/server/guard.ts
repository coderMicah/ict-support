import { can, type Permission } from "#/lib/access-control";
import { getSession } from "#/lib/auth-functions";
import { ForbiddenError, UnauthorizedError } from "#/lib/errors";

type Session = Awaited<ReturnType<typeof getSession>>;

export async function requireServerSession(): Promise<NonNullable<Session>> {
	const session = await getSession();

	if (!session) {
		throw new UnauthorizedError();
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
): Promise<NonNullable<Session>> {
	const session = await requireServerSession();

	if (!can(session.user.role, permission)) {
		throw new ForbiddenError();
	}

	return session;
}

export async function requireAdminRole(): Promise<NonNullable<Session>> {
	return requirePermission({ user: ["list"] });
}
