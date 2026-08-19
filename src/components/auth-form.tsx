import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormField } from "#/components/form-field";
import { signIn, signUp } from "#/lib/auth-client";
import { getErrorMessage } from "#/lib/errors";
import { signInSchema, signUpSchema } from "#/lib/schemas/auth";
import { inputClass } from "#/lib/utils";

export type AuthMode = "sign-in" | "sign-up";

type AuthFormProps = {
	mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const isSignUp = mode === "sign-up";

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
		defaultValues: isSignUp
			? { name: "", email: "", password: "" }
			: { email: "", password: "" },
	});

	const onSubmit = async (values: Record<string, unknown>) => {
		setError(null);
		setLoading(true);

		try {
			const email = String(values.email ?? "");
			const password = String(values.password ?? "");

			const request = isSignUp
				? signUp.email({
						name: String(values.name ?? ""),
						email,
						password,
					})
				: signIn.email({ email, password });

			const { error: authError } = await request;

			if (authError) {
				if (authError.code === "ACCOUNT_PENDING_APPROVAL") {
					await navigate({ to: "/pending-approval", replace: true });
					return;
				}

				setError(getErrorMessage(authError));
				setLoading(false);
				return;
			}

			await navigate({
				to: isSignUp ? "/sign-in" : "/dashboard",
				replace: true,
			});
		} catch {
			setError("Something went wrong. Please try again.");
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
			{error && (
				<p
					role="alert"
					className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
				>
					{error}
				</p>
			)}

			{isSignUp && (
				<FormField label="Full name" error={errors.name?.message}>
					<input
						{...register("name")}
						type="text"
						autoComplete="name"
						placeholder="Jane Doe"
						className={inputClass}
					/>
				</FormField>
			)}

			<FormField label="Email" error={errors.email?.message}>
				<input
					{...register("email")}
					type="email"
					autoComplete={isSignUp ? "email" : "email"}
					placeholder="you@example.com"
					className={inputClass}
				/>
			</FormField>

			<FormField label="Password" error={errors.password?.message}>
				<input
					{...register("password")}
					type="password"
					autoComplete={isSignUp ? "new-password" : "current-password"}
					placeholder="At least 8 characters"
					className={inputClass}
				/>
			</FormField>

			<button
				type="submit"
				disabled={loading}
				className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{loading ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
			</button>
		</form>
	);
}
