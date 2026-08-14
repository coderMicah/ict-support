import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { type FormEvent, useState } from "react";

export function SearchBox({
	initialQuery = "",
	placeholder = "Search articles, documents, and contacts…",
}: {
	initialQuery?: string;
	placeholder?: string;
}) {
	const [query, setQuery] = useState(initialQuery);
	const navigate = useNavigate();

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const q = query.trim();

		navigate({ to: "/search", search: { q: q || undefined } });
	}

	return (
		<form onSubmit={handleSubmit} className="w-full">
			<label htmlFor="search-query" className="sr-only">
				Search
			</label>
			<div className="relative">
				<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
				<input
					id="search-query"
					type="search"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder={placeholder}
					className="w-full rounded-lg border border-neutral-300 bg-white py-2.5 pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
				/>
			</div>
		</form>
	);
}
