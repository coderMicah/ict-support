import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/pending-approval")({
	component: PendingApprovalPage,
});

function PendingApprovalPage() {
	return (
		<div className="flex min-h-dvh items-center justify-center bg-neutral-50 px-5 py-12">
			<div className="w-full max-w-md">
				<div className="mb-8 flex items-center justify-center">
					<span className="text-lg font-semibold tracking-tight">
						ICT Support
					</span>
				</div>

				<div className="rounded-lg border border-neutral-200 bg-white p-6 text-center sm:p-8">
					<h1 className="text-2xl font-bold tracking-tight">
						Account pending approval
					</h1>
					<p className="mt-3 text-sm text-neutral-500">
						Your account is awaiting approval from an administrator. You&apos;ll
						be able to sign in once your account has been approved.
					</p>

					<Link
						to="/sign-in"
						className="mt-6 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
					>
						Back to sign in
					</Link>
				</div>
			</div>
		</div>
	);
}
