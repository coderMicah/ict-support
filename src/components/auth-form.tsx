import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { authClient } from "#/lib/auth-client";
import { getErrorMessage } from "#/lib/errors";

export type AuthMode = "sign-in" | "sign-up";

type AuthFormProps = {
	mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);
		setLoading(true);

		const form = event.currentTarget;
		const formData = new FormData(form);
		const email = String(formData.get("email") ?? "");
		const password = String(formData.get("password") ?? "");

		const onSuccess = async () => {
			await navigate({ to: "/dashboard", replace: true });
		};

		const request =
			mode === "sign-in"
				? authClient.signIn.email({ email, password })
				: authClient.signUp.email({
						name: String(formData.get("name") ?? ""),
						email,
						password,
					});

		request.then(
			({ error: authError }) => {
				if (authError) {
					setError(getErrorMessage(authError));
					setLoading(false);
					return;
				}

				void onSuccess();
			},
			() => {
				setError("Something went wrong. Please try again.");
				setLoading(false);
			},
		);
	};

	return (
		<form
			method="post"
			onSubmit={handleSubmit}
			className="space-y-4"
			noValidate
		>
			{error ? (
				<p
					role="alert"
					className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
				>
					{error}
				</p>
			) : null}

			{mode === "sign-up" ? (
				<div className="space-y-2">
					<label htmlFor="name" className="text-sm font-medium">
						Full name
					</label>
					<input
						id="name"
						name="name"
						type="text"
						autoComplete="name"
						required
						placeholder="Jane Doe"
						className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
					/>
				</div>
			) : null}

			<div className="space-y-2">
				<label htmlFor="email" className="text-sm font-medium">
					Email
				</label>
				<input
					id="email"
					name="email"
					type="email"
					autoComplete="email"
					required
					placeholder="you@example.com"
					className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
				/>
			</div>

			<div className="space-y-2">
				<label htmlFor="password" className="text-sm font-medium">
					Password
				</label>
				<input
					id="password"
					name="password"
					type="password"
					autoComplete={
						mode === "sign-in" ? "current-password" : "new-password"
					}
					required
					minLength={8}
					placeholder="At least 8 characters"
					className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{loading
					? "Please wait\u2026"
					: mode === "sign-in"
						? "Sign in"
						: "Create account"}
			</button>
		</form>
	);
}
