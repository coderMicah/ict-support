import { isValidLexicalState } from "./lexical";

type LexicalNode = {
	type?: string;
	tag?: string;
	text?: string;
	format?: number;
	url?: string;
	link?: string;
	listType?: string;
	children?: unknown;
};

const SAFE_URL_PATTERN = /^(https?:|mailto:|tel:)/i;

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function renderChildren(nodes: unknown): string {
	if (!Array.isArray(nodes)) {
		return "";
	}

	return nodes.map((child) => renderInline(child as LexicalNode)).join("");
}

function renderInline(node: LexicalNode): string {
	if (!node || typeof node !== "object") {
		return "";
	}

	if (node.type === "linebreak") {
		return "<br>";
	}

	if (node.type === "text") {
		return renderText(node);
	}

	if (node.type === "link") {
		return renderLink(node);
	}

	return "";
}

function renderText(node: LexicalNode): string {
	let text = escapeHtml(node.text ?? "");
	const format = node.format ?? 0;

	if (format & 8) {
		text = `<u>${text}</u>`;
	}
	if (format & 4) {
		text = `<s>${text}</s>`;
	}
	if (format & 2) {
		text = `<em>${text}</em>`;
	}
	if (format & 1) {
		text = `<strong>${text}</strong>`;
	}
	if (format & 16) {
		text = `<code>${text}</code>`;
	}

	const href = node.link;
	if (href && SAFE_URL_PATTERN.test(href)) {
		text = `<a href="${escapeHtml(href)}">${text}</a>`;
	}

	return text;
}

function renderLink(node: LexicalNode): string {
	const inner = renderChildren(node.children);

	if (!node.url || !SAFE_URL_PATTERN.test(node.url)) {
		return inner;
	}

	return `<a href="${escapeHtml(node.url)}">${inner}</a>`;
}

function childrenOf(node: LexicalNode): unknown[] {
	return Array.isArray(node.children) ? node.children : [];
}

function renderList(node: LexicalNode): string {
	const tag = node.listType === "number" ? "ol" : "ul";
	const items = childrenOf(node)
		.map((child) => renderListItem(child as LexicalNode))
		.join("");

	return `<${tag}>${items}</${tag}>`;
}

function renderListItem(node: LexicalNode): string {
	const inner = childrenOf(node)
		.map((child) => {
			const listItem = child as LexicalNode;

			return listItem.type === "list"
				? renderList(listItem)
				: renderInline(listItem);
		})
		.join("");

	return `<li>${inner}</li>`;
}

function renderBlock(node: LexicalNode): string {
	switch (node.type) {
		case "paragraph":
			return `<p>${renderChildren(node.children)}</p>`;
		case "heading": {
			const tag = /^h[1-6]$/.test(node.tag ?? "") ? node.tag : "h2";

			return `<${tag}>${renderChildren(node.children)}</${tag}>`;
		}
		case "quote":
			return `<blockquote>${renderChildren(node.children)}</blockquote>`;
		case "list":
			return renderList(node);
		default:
			return renderChildren(node.children);
	}
}

/**
 * Renders a serialized Lexical state to sanitized, server-safe HTML.
 *
 * Only the node types the article editor can produce are emitted. Text is
 * HTML-escaped and hyperlinks are restricted to http/https/mailto/tel URLs.
 * Returns an empty string for empty or invalid states.
 */
export function renderLexicalBody(stateJson: string): string {
	if (!isValidLexicalState(stateJson) || stateJson === "") {
		return "";
	}

	const parsed = JSON.parse(stateJson) as { root?: LexicalNode };
	const children = parsed?.root?.children;

	if (!Array.isArray(children)) {
		return "";
	}

	return children.map((child) => renderBlock(child as LexicalNode)).join("");
}
