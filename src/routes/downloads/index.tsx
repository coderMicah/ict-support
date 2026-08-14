import { createFileRoute } from "@tanstack/react-router";

import { getPublicDocuments } from "#/server/public";

export const Route = createFileRoute("/downloads/")({
	loader: () => getPublicDocuments(),
	head: () => ({
		meta: [
			{
				title: "Downloads · ICT Support",
			},
			{
				name: "description",
				content:
					"Official forms and documents published by the ICT department for staff to download.",
			},
		],
	}),
	component: DownloadsPage,
});

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function formatSize(bytes: number): string {
	if (bytes >= 1024 * 1024) {
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function DownloadsPage() {
	const documents = Route.useLoaderData();

	return (
		<div className="space-y-8">
			<header>
				<h1 className="text-3xl font-bold tracking-tight">Downloads</h1>
				<p className="mt-2 text-neutral-600">
					Official forms and documents published by the ICT department.
				</p>
			</header>

			{documents.length === 0 ? (
				<p className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
					No documents available yet. Check back soon.
				</p>
			) : (
				<ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
					{documents.map((document) => (
						<li
							key={document.id}
							className="flex items-start justify-between gap-4 p-4"
						>
							<div className="min-w-0">
								<p className="font-medium text-neutral-900">{document.title}</p>
								<p className="mt-0.5 text-sm text-neutral-500">
									{document.originalName} · {formatSize(document.size)}
								</p>
								<p className="mt-2 text-xs text-neutral-400">
									{document.categoryName ?? "Uncategorised"} · Updated{" "}
									{formatDate(document.updatedAt)}
								</p>
							</div>
							<a
								href={document.url}
								className="shrink-0 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
							>
								Download
							</a>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
