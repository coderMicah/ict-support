import { createFileRoute } from "@tanstack/react-router";

import { CategoryManagement } from "#/components/admin/category-management";
import { getCategories } from "#/server/categories";

export const Route = createFileRoute("/(protected)/admin/categories")({
	loader: () => getCategories(),
	component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
	const categories = Route.useLoaderData();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Categories</h1>
				<p className="mt-1 text-sm text-neutral-500">
					Create and manage knowledge base categories.
				</p>
			</div>

			<CategoryManagement initialCategories={categories} />
		</div>
	);
}
