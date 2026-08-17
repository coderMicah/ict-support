import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";

import { signIn, signUp } from "#/lib/auth-client";
import { getErrorMessage } from "#/lib/errors";
import { inputClass } from "#/lib/utils";

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

		const form = new FormData(event.currentTarget);
		const email = String(form.get("email") ?? "");
		const password = String(form.get("password") ?? "");

		const onSuccessSignIn = async () => {
			await navigate({ to: "/dashboard", replace: true });
		};

		const onSuccessSignUp = async () => {
			await navigate({ to: "/sign-in", replace: true });
		};

		const onPendingApproval = async () => {
			await navigate({ to: "/pending-approval", replace: true });
		};

		const request =
			mode === "sign-in"
				? signIn.email({ email, password })
				: signUp.email({
						name: String(form.get("name") ?? ""),
						email,
						password,
					});

		request.then(
			({ error: authError }) => {
				if (authError) {
					if (authError.code === "ACCOUNT_PENDING_APPROVAL") {
						void onPendingApproval();
						return;
					}

					setError(getErrorMessage(authError));
					setLoading(false);
					return;
				}

				void (mode === "sign-in" ? onSuccessSignIn() : onSuccessSignUp());
			},
			() => {
				setError("Something went wrong. Please try again.");
				setLoading(false);
			},
		);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
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
						className={inputClass}
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
					className={inputClass}
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
					className={inputClass}
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{loading
					? "Please wait…"
					: mode === "sign-in"
						? "Sign in"
						: "Create account"}
			</button>
		</form>
	);
}
