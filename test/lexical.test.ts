import { describe, expect, it } from "vitest";

import {
	emptyLexicalStateString,
	extractTextFromLexicalState,
	isValidLexicalState,
} from "#/lib/lexical";
import { slugify } from "#/lib/schemas/categories";

const paragraph = (text: string) =>
	JSON.stringify({
		root: {
			children: [
				{
					type: "paragraph",
					version: 1,
					children: [
						{ type: "text", version: 1, text, detail: 0, format: 0 },
					],
				},
			],
			direction: null,
			format: "",
			indent: 0,
			version: 1,
		},
	});

describe("isValidLexicalState", () => {
	it("accepts the empty editor state", () => {
		expect(isValidLexicalState(emptyLexicalStateString)).toBe(true);
	});

	it("accepts the empty string (no content yet)", () => {
		expect(isValidLexicalState("")).toBe(true);
	});

	it("accepts a populated editor state", () => {
		expect(isValidLexicalState(paragraph("Hello"))).toBe(true);
	});

	it("rejects invalid JSON and non-object roots", () => {
		expect(isValidLexicalState("not json")).toBe(false);
		expect(isValidLexicalState('{"root":"nope"}')).toBe(false);
		expect(isValidLexicalState("null")).toBe(false);
		expect(isValidLexicalState(123)).toBe(false);
	});
});

describe("extractTextFromLexicalState", () => {
	it("extracts plain text from paragraphs", () => {
		expect(extractTextFromLexicalState(paragraph("Hello world"))).toBe(
			"Hello world",
		);
	});

	it("joins text across block nodes", () => {
		const state = JSON.stringify({
			root: {
				children: [
					{
						type: "heading",
						version: 1,
						children: [
							{ type: "text", version: 1, text: "Title" },
						],
					},
					{
						type: "paragraph",
						version: 1,
						children: [
							{ type: "text", version: 1, text: "First" },
							{ type: "text", version: 1, text: "sentence" },
						],
					},
				],
				direction: null,
				format: "",
				indent: 0,
				version: 1,
			},
		});

		expect(extractTextFromLexicalState(state)).toBe("Title First sentence");
	});

	it("collapses repeated whitespace", () => {
		expect(
			extractTextFromLexicalState(
				paragraph("Lots   of   spaces   and\ttabs"),
			),
		).toBe("Lots of spaces and tabs");
	});

	it("returns empty string for empty or invalid input", () => {
		expect(extractTextFromLexicalState("")).toBe("");
		expect(extractTextFromLexicalState("not json")).toBe("");
	});
});

describe("slugify", () => {
	it("lowercases, hyphenates and strips disallowed characters", () => {
		expect(slugify("Setting up Office 365 VPN!")).toBe("setting-up-office-365-vpn");
	});

	it("handles whitespace and collapses repeats", () => {
		expect(slugify("  Multiple   Spaces  ")).toBe("multiple-spaces");
	});
});
