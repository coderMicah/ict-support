import { createFileRoute } from "@tanstack/react-router";

import { KnowledgeBaseShell } from "#/components/kb/kb-shell";

export const Route = createFileRoute("/contacts")({
	component: KnowledgeBaseShell,
});
