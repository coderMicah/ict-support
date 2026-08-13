import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)")({
	component: AuthLayout,
});

function AuthLayout() {
	return (
		<div className="flex min-h-dvh items-center justify-center bg-neutral-50 px-5 py-12 sm:px-10">
			<div className="w-full max-w-md">
				<div className="mb-8 flex items-center justify-center">
					<span className="text-lg font-semibold tracking-tight">
						ICT Support
					</span>
				</div>

				<div className="rounded-lg border border-neutral-200 bg-white p-6 sm:p-8">
					<Outlet />
				</div>
			</div>
		</div>
	);
}
