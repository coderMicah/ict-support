import { describe, expect, it } from "vitest";

import { can } from "#/lib/access-control";

describe("article lifecycle access", () => {
	it("allows admin to publish, archive, restore, and delete articles", () => {
		expect(
			can("admin", { articles: ["publish", "archive", "restore", "delete"] }),
		).toBe(true);
	});

	it("denies officers publish, archive, restore, and delete", () => {
		expect(can("user", { articles: ["publish"] })).toBe(false);
		expect(can("user", { articles: ["archive"] })).toBe(false);
		expect(can("user", { articles: ["restore"] })).toBe(false);
		expect(can("user", { articles: ["delete"] })).toBe(false);
	});

	it("allows officers to view, create, and update articles", () => {
		expect(can("user", { articles: ["view", "create", "update"] })).toBe(true);
	});

	it("allows admin to approve, archive, restore, and delete documents", () => {
		expect(
			can("admin", { documents: ["approve", "archive", "restore", "delete"] }),
		).toBe(true);
	});

	it("denies officers document approval and lifecycle actions", () => {
		expect(can("user", { documents: ["approve"] })).toBe(false);
		expect(can("user", { documents: ["archive"] })).toBe(false);
		expect(can("user", { documents: ["restore"] })).toBe(false);
		expect(can("user", { documents: ["delete"] })).toBe(false);
	});

	it("allows officers to view, create, and update documents", () => {
		expect(can("user", { documents: ["view", "create", "update"] })).toBe(true);
	});

	it("allows admin to create, update, and delete contacts", () => {
		expect(
			can("admin", { contacts: ["create", "update", "delete"] }),
		).toBe(true);
	});

	it("allows officers to view and update contacts, but not create or delete", () => {
		expect(can("user", { contacts: ["view", "update"] })).toBe(true);
		expect(can("user", { contacts: ["create"] })).toBe(false);
		expect(can("user", { contacts: ["delete"] })).toBe(false);
	});

	it("allows officers and admins to upload images", () => {
		expect(can("user", { uploads: ["create"] })).toBe(true);
		expect(can("admin", { uploads: ["create"] })).toBe(true);
	});

	it("denies image uploads to anonymous users", () => {
		expect(can(null, { uploads: ["create"] })).toBe(false);
	});

	it("denies unknown or missing roles", () => {
		expect(can(null, { articles: ["publish"] })).toBe(false);
		expect(can("superuser", { articles: ["view"] })).toBe(false);
	});
});

describe("publish permission model", () => {
	it("admin role always has publish permission via can()", () => {
		expect(can("admin", { articles: ["publish"] })).toBe(true);
	});

	it("user role does not have publish permission via can()", () => {
		expect(can("user", { articles: ["publish"] })).toBe(false);
	});

	it("admin role has all article lifecycle permissions", () => {
		expect(
			can("admin", {
				articles: ["create", "update", "publish", "archive", "restore", "delete"],
			}),
		).toBe(true);
	});

	it("user role can create and update but not publish", () => {
		expect(can("user", { articles: ["create"] })).toBe(true);
		expect(can("user", { articles: ["update"] })).toBe(true);
		expect(can("user", { articles: ["publish"] })).toBe(false);
	});

	it("user role can view articles", () => {
		expect(can("user", { articles: ["view"] })).toBe(true);
	});

	it("admin can manage categories fully", () => {
		expect(
			can("admin", { categories: ["view", "create", "update", "delete"] }),
		).toBe(true);
	});

	it("user can only view categories", () => {
		expect(can("user", { categories: ["view"] })).toBe(true);
		expect(can("user", { categories: ["create"] })).toBe(false);
	});
});
