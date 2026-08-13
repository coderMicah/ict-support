import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthForm } from "#/components/auth-form";

export const Route = createFileRoute("/(auth)/sign-in")({
	component: SignInPage,
});

function SignInPage() {
	return (
		<div className="space-y-6">
			<div className="space-y-1.5">
				<h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
				<p className="text-sm text-neutral-500">
					Sign in to your account to continue.
				</p>
			</div>

			<AuthForm mode="sign-in" />

			<p className="text-center text-sm text-neutral-500">
				Don&apos;t have an account?{" "}
				<Link
					to="/sign-up"
					className="font-medium text-neutral-900 underline-offset-4 hover:underline"
				>
					Create one
				</Link>
			</p>
		</div>
	);
}
