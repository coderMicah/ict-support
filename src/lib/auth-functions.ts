import { createServerFn } from "@tanstack/react-start";

export const getSession = createServerFn({
	method: "GET",
}).handler(async () => {
	const { getRequestHeaders } = await import("@tanstack/react-start/server");
	const { auth } = await import("#/lib/auth");

	return await auth.api.getSession({
		headers: getRequestHeaders(),
	});
});

export type ServerSession = Awaited<ReturnType<typeof getSession>>;

export async function getServerSession(): Promise<ServerSession> {
	return await getSession();
}
