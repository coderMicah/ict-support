import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthForm } from "#/components/auth-form";

export const Route = createFileRoute("/(auth)/sign-up")({
	component: SignUpPage,
});

function SignUpPage() {
	return (
		<div className="space-y-6">
			<div className="space-y-1.5">
				<h1 className="text-2xl font-bold tracking-tight">
					Create your account
				</h1>
				<p className="text-sm text-neutral-500">
					Get started in less than a minute.
				</p>
			</div>

			<AuthForm mode="sign-up" />

			<p className="text-center text-sm text-neutral-500">
				Already have an account?{" "}
				<Link
					to="/sign-in"
					className="font-medium text-neutral-900 underline-offset-4 hover:underline"
				>
					Sign in
				</Link>
			</p>
		</div>
	);
}
