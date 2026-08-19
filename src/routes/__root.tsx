import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";

import { getSession } from "#/lib/auth-functions";
import appCss from "../styles.css?url";

export interface RouterContext {
	session: Awaited<ReturnType<typeof getSession>>;
}

function RootErrorComponent({
	error,
	reset,
}: {
	error: unknown;
	reset: () => void;
}) {
	const message =
		error instanceof Error ? error.message : "An unexpected error occurred.";

	return (
		<div className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
			<div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-8 text-center">
				<h1 className="text-xl font-bold tracking-tight text-neutral-900">
					Something went wrong
				</h1>
				<p className="mt-2 text-sm text-neutral-500">{message}</p>
				<button
					type="button"
					onClick={reset}
					className="mt-6 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
				>
					Try again
				</button>
			</div>
		</div>
	);
}

function RootNotFoundComponent() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
			<div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-8 text-center">
				<h1 className="text-xl font-bold tracking-tight text-neutral-900">
					Page not found
				</h1>
				<p className="mt-2 text-sm text-neutral-500">
					The page you are looking for does not exist.
				</p>
				<a
					href="/"
					className="mt-6 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
				>
					Go home
				</a>
			</div>
		</div>
	);
}

export const Route = createRootRouteWithContext<RouterContext>()({
	errorComponent: RootErrorComponent,
	notFoundComponent: RootNotFoundComponent,
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "ICT Support Portal",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	beforeLoad: async () => {
		const session = await getSession();

		return {
			session,
		};
	},
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
				<Toaster position="bottom-right" richColors />
				{/* <TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/> */}
			</body>
		</html>
	);
}
