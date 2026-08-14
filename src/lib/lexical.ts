export const emptyLexicalState = {
	root: {
		children: [
			{
				type: "paragraph",
				version: 1,
				children: [],
				direction: null,
				format: "",
				indent: 0,
			},
		],
		direction: null,
		format: "",
		indent: 0,
		version: 1,
	},
} as const;

export const emptyLexicalStateString = JSON.stringify(emptyLexicalState);

export function isValidLexicalState(value: unknown): boolean {
	if (typeof value !== "string") {
		return false;
	}

	if (value === "") {
		return true;
	}

	try {
		const parsed: unknown = JSON.parse(value);

		return (
			typeof parsed === "object" &&
			parsed !== null &&
			"root" in parsed &&
			typeof (parsed as { root: unknown }).root === "object"
		);
	} catch {
		return false;
	}
}

type LexicalNode = {
	type?: string;
	text?: string;
	children?: unknown;
};

export function extractTextFromLexicalState(stateJson: string): string {
	if (!isValidLexicalState(stateJson) || stateJson === "") {
		return "";
	}

	const parsed = JSON.parse(stateJson) as { root?: LexicalNode };
	const parts: string[] = [];

	const walk = (node: LexicalNode | null | undefined) => {
		if (!node || typeof node !== "object") {
			return;
		}

		if (node.type === "text" && typeof node.text === "string") {
			parts.push(node.text);
			return;
		}

		if (Array.isArray(node.children)) {
			for (const child of node.children) {
				walk(child as LexicalNode);
			}
		}
	};

	walk(parsed?.root);

	return parts.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Derives a plain-text summary from a serialized Lexical state.
 *
 * Used when an article has no explicit excerpt: category listings, search
 * results, and link previews fall back to the body's first words.
 */
export function deriveExcerpt(stateJson: string, maxLength = 160): string {
	const text = extractTextFromLexicalState(stateJson);

	if (text.length <= maxLength) {
		return text;
	}

	return `${text.slice(0, maxLength).trimEnd()}…`;
}
