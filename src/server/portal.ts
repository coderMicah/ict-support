import { createServerFn } from "@tanstack/react-start";

export type PortalOverview = {
	user: {
		id: string;
		name: string;
		email: string;
		role: string | null | undefined;
	};
};

export const getPortalOverview = createServerFn({
	method: "GET",
}).handler(async (): Promise<PortalOverview> => {
	const { requireServerSession } = await import("./guard");
	const session = await requireServerSession();

	return {
		user: {
			id: session.user.id,
			name: session.user.name,
			email: session.user.email,
			role: session.user.role,
		},
	};
});
