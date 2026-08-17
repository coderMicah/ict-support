import type { ReactNode } from "react";

type FormFieldProps = {
	label: string;
	error?: string;
	optional?: boolean;
	children: ReactNode;
};

export function FormField({
	label,
	error,
	optional,
	children,
}: FormFieldProps) {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: children is the input control
		<label className="block">
			<span className="mb-1 block text-sm font-medium text-neutral-700">
				{label}
				{optional && (
					<span className="font-normal text-neutral-400"> (optional)</span>
				)}
			</span>
			{children}
			{error && (
				<span className="mt-1 block text-xs text-red-600">{error}</span>
			)}
		</label>
	);
}
