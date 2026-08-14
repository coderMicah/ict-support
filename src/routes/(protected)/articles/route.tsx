import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(protected)/articles")({
	component: ArticlesLayout,
});

function ArticlesLayout() {
	return <Outlet />;
}
