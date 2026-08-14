import { createFileRoute } from "@tanstack/react-router";

import { DocumentForm } from "#/components/documents/document-form";
import { getCategories } from "#/server/categories";

export const Route = createFileRoute("/(protected)/documents/new")({
	loader: () => getCategories(),
	component: NewDocumentPage,
});

function NewDocumentPage() {
	const categories = Route.useLoaderData();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Upload document</h1>
				<p className="mt-1 text-sm text-neutral-500">
					Upload an office document or PDF. It needs admin approval before it is
					published on the downloads page.
				</p>
			</div>

			<DocumentForm mode="create" categories={categories} />
		</div>
	);
}
