import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormField } from "#/components/form-field";
import { signInSchema, signUpSchema } from "#/lib/schemas/auth";
import { inputClass } from "#/lib/utils";
import { signIn, signUp } from "#/server/auth";

export type AuthMode = "sign-in" | "sign-up";

type AuthFormProps = {
	mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
	const isSignUp = mode === "sign-up";

	const form = useForm({
		resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
		defaultValues: isSignUp
			? { name: "", email: "", password: "" }
			: { email: "", password: "" },
	});

	const onSubmit = async (values: Record<string, unknown>) => {
		const result = isSignUp
			? await signUp({ data: values as never })
			: await signIn({ data: values as never });

		if (result.error) {
			toast.error(result.error);
			return;
		}

		toast.success(isSignUp ? "Account created!" : "Welcome back!");
		window.location.href = isSignUp ? "/sign-in" : "/";
	};

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
			{isSignUp && (
				<FormField
					label="Full name"
					error={form.formState.errors.name?.message}
				>
					<input
						{...form.register("name")}
						type="text"
						autoComplete="name"
						placeholder="Jane Doe"
						className={inputClass}
					/>
				</FormField>
			)}

			<FormField label="Email" error={form.formState.errors.email?.message}>
				<input
					{...form.register("email")}
					type="email"
					autoComplete="email"
					placeholder="you@example.com"
					className={inputClass}
				/>
			</FormField>

			<FormField
				label="Password"
				error={form.formState.errors.password?.message}
			>
				<input
					{...form.register("password")}
					type="password"
					autoComplete={isSignUp ? "new-password" : "current-password"}
					placeholder="At least 8 characters"
					className={inputClass}
				/>
			</FormField>

			<button
				type="submit"
				disabled={form.formState.isSubmitting}
				className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{form.formState.isSubmitting
					? "Please wait…"
					: isSignUp
						? "Create account"
						: "Sign in"}
			</button>
		</form>
	);
}
