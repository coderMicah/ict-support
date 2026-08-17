import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { auth } from "#/lib/auth";

export const getSession = createServerFn({ method: "GET" }).handler(
	async () => {
		return await auth.api.getSession({
			headers: getRequestHeaders(),
		});
	},
);

export type ServerSession = Awaited<ReturnType<typeof getSession>>;

export async function getServerSession(): Promise<ServerSession> {
	return await getSession();
}
