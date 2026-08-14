import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(protected)/documents")({
	component: DocumentsLayout,
});

function DocumentsLayout() {
	return <Outlet />;
}
