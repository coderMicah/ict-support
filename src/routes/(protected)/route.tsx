import { createFileRoute, redirect } from "@tanstack/react-router";

import { PortalShell } from "#/components/portal-shell";

export const Route = createFileRoute("/(protected)")({
	beforeLoad: ({ context }) => {
		if (!context.session) {
			throw redirect({
				to: "/sign-in",
			});
		}

		return {
			session: context.session.session,
			user: context.session.user,
		};
	},

	component: ProtectedLayout,
});

function ProtectedLayout() {
	const { user } = Route.useRouteContext();

	return <PortalShell user={user} />;
}
