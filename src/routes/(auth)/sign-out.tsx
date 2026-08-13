import { createFileRoute, redirect } from "@tanstack/react-router";

import { signOut } from "#/lib/auth-client";

export const Route = createFileRoute("/(auth)/sign-out")({
	loader: async () => {
		await signOut();
		throw redirect({ to: "/sign-in", replace: true });
	},
});
