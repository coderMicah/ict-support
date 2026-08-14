import { describe, expect, it } from "vitest";

import { renderLexicalBody } from "#/lib/lexical-html";

const textNode = (text: string, format = 0, detail = 0) => ({
	type: "text",
	version: 1,
	text,
	format,
	style: "",
	detail,
	mode: "normal",
});

const paragraph = (children: unknown[]) => ({
	type: "paragraph",
	version: 1,
	children,
	direction: null,
	format: "",
	indent: 0,
});

const state = (rootChildren: unknown[]) =>
	JSON.stringify({
		root: { children: rootChildren, direction: null, format: "", indent: 0, version: 1 },
	});

describe("renderLexicalBody", () => {
	it("renders a plain paragraph", () => {
		const html = renderLexicalBody(state([paragraph([textNode("Hello world")])]));

		expect(html).toBe("<p>Hello world</p>");
	});

	it("escapes text content", () => {
		const html = renderLexicalBody(state([paragraph([textNode("<script>alert(1)</script>")])]));

		expect(html).toBe("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
	});

	it("renders text formats: bold, italic, underline, strikethrough, code", () => {
		const html = renderLexicalBody(
			state([
				paragraph([
					textNode("bold", 1),
					textNode(" italic ", 2),
					textNode("under", 8),
					textNode(" strike ", 4),
					textNode("code", 16),
				]),
			]),
		);

		expect(html).toBe(
			"<p><strong>bold</strong><em> italic </em><u>under</u><s> strike </s><code>code</code></p>",
		);
	});

	it("renders headings, blockquote, and lists", () => {
		const html = renderLexicalBody(
			state([
				{ type: "heading", version: 1, tag: "h2", children: [textNode("Title")], ...blank },
				{ type: "quote", version: 1, children: [textNode("Quoted")], ...blank },
				{
					type: "list",
					version: 1,
					listType: "bullet",
					start: 1,
					tag: "ul",
					children: [
						{
							type: "listitem",
							version: 1,
							value: 1,
							children: [textNode("One")],
							...blank,
						},
					],
				},
				{ type: "paragraph", version: 1, children: [textNode("After")], ...blank },
			]),
		);

		expect(html).toBe(
			"<h2>Title</h2><blockquote>Quoted</blockquote><ul><li>One</li></ul><p>After</p>",
		);
	});

	it("renders nested lists", () => {
		const html = renderLexicalBody(
			state([
				{
					type: "list",
					version: 1,
					listType: "bullet",
					start: 1,
					tag: "ul",
					children: [
						{
							type: "listitem",
							version: 1,
							value: 1,
							children: [
								textNode("Parent"),
								{
									type: "list",
									version: 1,
									listType: "bullet",
									start: 1,
									tag: "ul",
									children: [
										{
											type: "listitem",
											version: 1,
											value: 1,
											children: [textNode("Child")],
											...blank,
										},
									],
									...blank,
								},
							],
							...blank,
						},
					],
					...blank,
				},
			]),
		);

		expect(html).toBe("<ul><li>Parent<ul><li>Child</li></ul></li></ul>");
	});

	it("renders links with safe schemes and text-node links", () => {
		const html = renderLexicalBody(
			state([
				paragraph([
					{ type: "link", version: 1, url: "https://example.com", children: [textNode("Example")], ...blank },
					{ type: "text", version: 1, text: " mail", format: 0, style: "", detail: 0, mode: "normal", link: "https://other.dev" },
				]),
			]),
		);

		expect(html).toBe(
			'<p><a href="https://example.com">Example</a><a href="https://other.dev"> mail</a></p>',
		);
	});

	it("drops unsafe link schemes and renders plain text", () => {
		const html = renderLexicalBody(
			state([
				paragraph([
					{ type: "link", version: 1, url: "javascript:alert(1)", children: [textNode("Click")], ...blank },
				]),
			]),
		);

		expect(html).toBe("<p>Click</p>");
	});

	it("renders line breaks", () => {
		const html = renderLexicalBody(
			state([paragraph([textNode("A"), { type: "linebreak", version: 1 }, textNode("B")])]),
		);

		expect(html).toBe("<p>A<br>B</p>");
	});

	it("returns an empty string for empty, invalid, or malformed input", () => {
		expect(renderLexicalBody("")).toBe("");
		expect(renderLexicalBody("not json")).toBe("");
		expect(renderLexicalBody(JSON.stringify({}))).toBe("");
		expect(renderLexicalBody('{"root":null}')).toBe("");
		expect(renderLexicalBody(JSON.stringify({ root: { children: null } }))).toBe("");
	});
});

const blank = { direction: null, format: "", indent: 0 };
