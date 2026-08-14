import { createFileRoute } from "@tanstack/react-router";

import { DocumentForm } from "#/components/documents/document-form";
import { getCategories } from "#/server/categories";
import { getDocument } from "#/server/documents";

export const Route = createFileRoute("/(protected)/documents/$documentId/edit")(
	{
		loader: async ({ params }) => {
			const [document, categories] = await Promise.all([
				getDocument({ data: { id: Number(params.documentId) } }),
				getCategories(),
			]);

			return { document, categories };
		},
		component: EditDocumentPage,
	},
);

function EditDocumentPage() {
	const { document, categories } = Route.useLoaderData();

	if (document.state === "archived") {
		return (
			<div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
				<h1 className="text-lg font-semibold tracking-tight">
					Archived document
				</h1>
				<p className="mt-2 text-sm text-neutral-500">
					"{document.title}" is archived and cannot be edited. Restore it first
					if you need to make changes.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Edit document</h1>
				<p className="mt-1 text-sm text-neutral-500">
					Update the title or category. The document keeps its current state.
				</p>
			</div>

			<DocumentForm mode="edit" initial={document} categories={categories} />
		</div>
	);
}
