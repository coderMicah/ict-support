import { createFileRoute } from "@tanstack/react-router";

import { CategoryManagement } from "#/components/admin/category-management";
import { can } from "#/lib/access-control";
import { getCategories } from "#/server/categories";

export const Route = createFileRoute("/(protected)/categories")({
	loader: async ({ context }) => ({
		categories: await getCategories(),
		user: context.user,
	}),
	component: CategoriesPage,
});

function CategoriesPage() {
	const { categories, user } = Route.useLoaderData();
	const canManage = can(user.role, { categories: ["create"] });

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Categories</h1>
				<p className="mt-1 text-sm text-neutral-500">
					{canManage
						? "Create and manage knowledge base categories."
						: "Browse ICT knowledge base content by category."}
				</p>
			</div>

			{canManage ? (
				<CategoryManagement initialCategories={categories} />
			) : categories.length === 0 ? (
				<div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
					<p className="text-sm text-neutral-500">
						No categories yet. Check back soon.
					</p>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{categories.map((category) => (
						<div
							key={category.id}
							className="flex flex-col rounded-lg border border-neutral-200 bg-white p-5"
						>
							<h2 className="text-base font-semibold tracking-tight">
								{category.name}
							</h2>
							{category.description && (
								<p className="mt-1 text-sm text-neutral-500">
									{category.description}
								</p>
							)}
							<p className="mt-auto pt-4 text-xs text-neutral-400">
								{category.slug}
							</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
