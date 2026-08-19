import { createFileRoute, redirect } from "@tanstack/react-router";

import { PortalShell } from "#/components/portal-shell";
import { getErrorMessage } from "#/lib/errors";

export const Route = createFileRoute("/(protected)")({
	beforeLoad: ({ context }) => {
		if (!context.session) {
			throw redirect({
				to: "/sign-in",
			});
		}

		const { banned } = context.session.user as Record<string, unknown>;
		if (banned) {
			throw redirect({
				to: "/sign-in",
			});
		}

		return {
			session: context.session.session,
			user: context.session.user,
		};
	},

	pendingComponent: PendingSpinner,
	errorComponent: ProtectedErrorComponent,

	component: ProtectedLayout,
});

function PendingSpinner() {
	return (
		<div className="flex min-h-[50vh] items-center justify-center">
			<div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-900" />
		</div>
	);
}

function ProtectedErrorComponent({
	error,
	reset,
}: {
	error: unknown;
	reset: () => void;
}) {
	const message = getErrorMessage(error);

	return (
		<div className="flex min-h-[50vh] items-center justify-center p-6">
			<div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-8 text-center">
				<h1 className="text-xl font-bold tracking-tight text-neutral-900">
					Access denied
				</h1>
				<p className="mt-2 text-sm text-neutral-500">{message}</p>
				<button
					type="button"
					onClick={reset}
					className="mt-6 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
				>
					Try again
				</button>
			</div>
		</div>
	);
}

function ProtectedLayout() {
	const { user } = Route.useRouteContext();

	return <PortalShell user={user} />;
}
