import { z } from "zod";

import { slugRegex } from "./categories";

const slugField = z
	.string()
	.trim()
	.min(1, "Invalid slug.")
	.max(200, "Invalid slug.")
	.regex(slugRegex, "Invalid slug.");

export const publicCategorySlugSchema = z.object({
	categorySlug: slugField,
});

export const publicArticleSlugSchema = z.object({
	categorySlug: slugField,
	articleSlug: slugField,
});
