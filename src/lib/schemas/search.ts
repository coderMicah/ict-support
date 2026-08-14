import { z } from "zod";

export const searchQuerySchema = z.object({
	query: z.string().trim().max(200, "Search must be at most 200 characters."),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
