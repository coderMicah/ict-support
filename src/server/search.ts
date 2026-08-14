import { createServerFn } from "@tanstack/react-start";
import { searchQuerySchema } from "#/lib/schemas/search";
import { type SearchResult, searchAction } from "#/lib/search";

import { getServerSession } from "./guard";

/**
 * Global search across articles, documents, and contacts.
 *
 * Anonymous callers only ever see published articles, approved documents, and
 * active contacts. Authenticated callers additionally see content their role
 * may manage (drafts and pending content for officers, archived content for
 * admins).
 */
export const getSearchResults = createServerFn({
	method: "GET",
})
	.validator(searchQuerySchema)
	.handler(async ({ data }): Promise<SearchResult> => {
		const session = await getServerSession();
		const role = session?.user.role;

		return searchAction(
			data.query,
			role === "admin" || role === "user" ? role : null,
		);
	});
