import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

import { can } from "#/lib/access-control";
import type { DocumentItem } from "#/lib/documents";
import { getErrorMessage } from "#/lib/errors";
import {
	approveDocument,
	archiveDocument,
	deleteDocument,
	getDocuments,
	restoreDocument,
} from "#/server/documents";

export const Route = createFileRoute("/(protected)/documents/")({
	loader: async ({ context }) => ({
		documents: await getDocuments(),
		user: context.user,
	}),
	component: DocumentsPage,
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

function DocumentsPage() {
	const { documents, user } = Route.useLoaderData();
	const router = useRouter();

	const canApprove = can(user.role, { documents: ["approve"] });
	const canArchive = can(user.role, { documents: ["archive"] });
	const canRestore = can(user.role, { documents: ["restore"] });
	const canDelete = can(user.role, { documents: ["delete"] });

	const runAction = async (
		action: () => Promise<unknown>,
		successMessage: string,
	) => {
		try {
			await action();
			toast.success(successMessage);
			await router.invalidate();
		} catch (error) {
			toast.error(getErrorMessage(error));
		}
	};

	const onDelete = (document: DocumentItem) => {
		const confirmed = window.confirm(
			`Permanently delete "${document.title}" and its file? This cannot be undone.`,
		);

		if (!confirmed) {
			return;
		}

		void runAction(
			() => deleteDocument({ data: { id: document.id } }),
			"Document deleted.",
		);
	};

	const actionButtonClass =
		"rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium transition-colors hover:bg-neutral-100";

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Documents</h1>
					<p className="mt-1 text-sm text-neutral-500">
						Official documents shared with staff. Uploads need admin approval
						before they appear on the public downloads page.
					</p>
				</div>
				<Link
					to="/documents/new"
					className="shrink-0 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
				>
					Upload document
				</Link>
			</div>

			{documents.length === 0 ? (
				<div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
					<p className="text-sm text-neutral-500">
						No documents yet. Upload the first one.
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{documents.map((document) => (
						<div
							key={document.id}
							className="rounded-lg border border-neutral-200 bg-white p-5"
						>
							<div className="flex items-start justify-between gap-4">
								<div>
									<h2 className="text-base font-semibold tracking-tight">
										{document.title}
									</h2>
									<p className="mt-1 text-sm text-neutral-500">
										{document.originalName} · {formatSize(document.size)} ·{" "}
										{document.categoryName ?? "Uncategorised"}
									</p>
								</div>
								<span className="inline-flex shrink-0 items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium capitalize text-neutral-600">
									{document.state}
								</span>
							</div>

							<p className="mt-3 text-xs text-neutral-400">
								Updated {formatDate(document.updatedAt)}
							</p>

							<div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
								{document.state === "approved" && (
									<a
										href={`/uploads/documents/${document.fileKey}`}
										className={actionButtonClass}
									>
										Download
									</a>
								)}

								{document.state !== "archived" && (
									<Link
										to="/documents/$documentId/edit"
										params={{ documentId: String(document.id) }}
										className={actionButtonClass}
									>
										Edit
									</Link>
								)}

								{document.state === "pending" && canApprove && (
									<button
										type="button"
										onClick={() =>
											void runAction(
												() => approveDocument({ data: { id: document.id } }),
												"Document approved.",
											)
										}
										className={actionButtonClass}
									>
										Approve
									</button>
								)}

								{document.state === "approved" && canArchive && (
									<button
										type="button"
										onClick={() =>
											void runAction(
												() => archiveDocument({ data: { id: document.id } }),
												"Document archived.",
											)
										}
										className={actionButtonClass}
									>
										Archive
									</button>
								)}

								{document.state === "archived" && canRestore && (
									<button
										type="button"
										onClick={() =>
											void runAction(
												() => restoreDocument({ data: { id: document.id } }),
												"Document restored.",
											)
										}
										className={actionButtonClass}
									>
										Restore
									</button>
								)}

								{canDelete && (
									<button
										type="button"
										onClick={() => onDelete(document)}
										className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
									>
										Delete permanently
									</button>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
