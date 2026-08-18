import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes, scrypt } from "node:crypto";
import { createServer as createNetServer } from "node:net";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";

import { db } from "#/db";
import { account, documents, user } from "#/db/schema";
import { archiveArticleAction, createArticleAction, publishArticleAction } from "#/lib/articles";
import { createCategoryAction } from "#/lib/categories";
import { createContactAction } from "#/lib/contacts";

import { testDatabaseUrl } from "./env.ts";

const password = "BoundaryPass123!";

let serverProcess: ChildProcess | undefined;
let baseUrl = "";
let serverOutput = "";

function bodyWithText(text: string): string {
	return JSON.stringify({
		root: {
			children: [
				{
					type: "paragraph",
					version: 1,
					children: [{ type: "text", version: 1, text }],
				},
			],
			direction: null,
			format: "",
			indent: 0,
			version: 1,
		},
	});
}

async function findFreePort(): Promise<number> {
	return new Promise((resolve, reject) => {
		const probe = createNetServer();
		probe.unref();
		probe.on("error", reject);
		probe.listen(0, "127.0.0.1", () => {
			const address = probe.address();
			if (typeof address === "object" && address) {
				const port = address.port;
				probe.close(() => resolve(port));
			} else {
				reject(new Error("Failed to allocate a free port."));
			}
		});
	});
}

async function bootServer(): Promise<void> {
	const port = await findFreePort();
	baseUrl = `http://127.0.0.1:${port}`;

	const viteBin = path.resolve(
		process.cwd(),
		"node_modules",
		"vite",
		"bin",
		"vite.js",
	);

	serverProcess = spawn(
		process.execPath,
		[viteBin, "dev", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
		{
			cwd: process.cwd(),
			env: {
				...process.env,
				DATABASE_URL: testDatabaseUrl,
				BROWSER: "none",
			},
			stdio: ["ignore", "pipe", "pipe"],
		},
	);

	const onOutput = (chunk: Buffer) => {
		serverOutput += chunk.toString();
		if (serverOutput.length > 16_000) {
			serverOutput = serverOutput.slice(-16_000);
		}
	};
	serverProcess.stdout?.on("data", onOutput);
	serverProcess.stderr?.on("data", onOutput);

	const deadline = Date.now() + 90_000;
	while (Date.now() < deadline) {
		try {
			const response = await fetch(baseUrl, { signal: AbortSignal.timeout(5_000) });
			if (response.status < 500) {
				return;
			}
		} catch {
			// Not ready yet.
		}
		await new Promise((resolve) => setTimeout(resolve, 1_000));
	}

	throw new Error(
		`Boundary smoke server did not become ready.\n--- server output ---\n${serverOutput}`,
	);
}

function hashBoundaryPassword(password: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const salt = randomBytes(16).toString("hex");
		scrypt(
			password.normalize("NFKC"),
			salt,
			64,
			{ N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 },
			(error, key) => {
				if (error) {
					reject(error);
					return;
				}
				resolve(`${salt}:${key.toString("hex")}`);
			},
		);
	});
}

async function createUser(
	email: string,
	name: string,
	role: "admin" | "user",
): Promise<void> {
	// Insert directly (matching better-auth's scrypt envelope) so the
	// account-approval hook never sees a pending user during setup.
	const id = randomBytes(16).toString("hex");
	const passwordHash = await hashBoundaryPassword(password);

	await db.insert(user).values({
		id,
		name,
		email,
		emailVerified: true,
		role,
		approved: true,
	});
	await db.insert(account).values({
		id: randomBytes(16).toString("hex"),
		accountId: id,
		providerId: "credential",
		userId: id,
		password: passwordHash,
	});
}

async function seedFixtures(): Promise<void> {
	await db.execute(sql`TRUNCATE TABLE categories RESTART IDENTITY CASCADE`);
	await db.execute(sql`TRUNCATE TABLE documents RESTART IDENTITY CASCADE`);
	await db.execute(sql`TRUNCATE TABLE contacts RESTART IDENTITY CASCADE`);
	await db.delete(user).where(sql`email like '%@boundary.local'`);

	const category = await createCategoryAction({
		name: "Boundary",
		slug: "boundary",
		description: "Boundary smoke fixtures.",
		sortOrder: 0,
	});

	const published = await createArticleAction({
		title: "Boundary Public Article",
		slug: "boundary-public-article",
		categoryId: category.id,
		excerpt: "Publicly visible article.",
		body: bodyWithText("Public article body."),
	});
	await publishArticleAction(published.id);

	await createArticleAction({
		title: "Boundary Draft Article",
		slug: "boundary-draft-article",
		categoryId: category.id,
		body: bodyWithText("Draft article body."),
	});

	const archived = await createArticleAction({
		title: "Boundary Archived Article",
		slug: "boundary-archived-article",
		categoryId: category.id,
		body: bodyWithText("Archived article body."),
	});
	await publishArticleAction(archived.id);
	await archiveArticleAction(archived.id);

	await db.insert(documents).values([
		{
			title: "Boundary Approved Doc",
			fileKey: "11111111111111111111111111111111.pdf",
			originalName: "approved.pdf",
			contentType: "application/pdf",
			size: 10,
			state: "approved",
		},
		{
			title: "Boundary Pending Doc",
			fileKey: "22222222222222222222222222222222.pdf",
			originalName: "pending.pdf",
			contentType: "application/pdf",
			size: 10,
			state: "pending",
		},
		{
			title: "Boundary Archived Doc",
			fileKey: "33333333333333333333333333333333.pdf",
			originalName: "archived.pdf",
			contentType: "application/pdf",
			size: 10,
			state: "archived",
		},
	]);

	await createContactAction({
		name: "Boundary Active Contact",
		role: "IT Support",
		phone: "111",
		sortOrder: 0,
		active: true,
	});
	await createContactAction({
		name: "Boundary Inactive Contact",
		role: "IT Support",
		phone: "222",
		sortOrder: 1,
		active: false,
	});

	await createUser("officer@boundary.local", "Boundary Officer", "user");
	await createUser("admin@boundary.local", "Boundary Admin", "admin");
}

async function cleanup(): Promise<void> {
	if (serverProcess) {
		serverProcess.kill();
		serverProcess = undefined;
	}

	try {
		await db.execute(sql`TRUNCATE TABLE categories RESTART IDENTITY CASCADE`);
		await db.execute(sql`TRUNCATE TABLE documents RESTART IDENTITY CASCADE`);
		await db.execute(sql`TRUNCATE TABLE contacts RESTART IDENTITY CASCADE`);
		await db.delete(user).where(sql`email like '%@boundary.local'`);
	} catch {
		// Best-effort cleanup.
	}
}

class CookieJar {
	private readonly store = new Map<string, string>();

	capture(header: string | null): void {
		if (!header) {
			return;
		}

		for (const part of header.split(",")) {
			const [pair] = part.split(";");
			const separator = pair.indexOf("=");
			if (separator === -1) {
				continue;
			}
			this.store.set(
				pair.slice(0, separator).trim(),
				pair.slice(separator + 1).trim(),
			);
		}
	}

	header(): string {
		return [...this.store.entries()]
			.map(([key, value]) => `${key}=${value}`)
			.join("; ");
	}
}

async function signIn(email: string): Promise<CookieJar> {
	const jar = new CookieJar();
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	const cookie = jar.header();
	if (cookie) {
		headers.Cookie = cookie;
	}
	const response = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
		method: "POST",
		headers,
		body: JSON.stringify({ email, password }),
	});
	jar.capture(response.headers.get("set-cookie"));
	return jar;
}

async function fetchText(url: string): Promise<string> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Unexpected status ${response.status} for ${url}`);
	}
	return await response.text();
}

describe("public-vs-internal boundary", () => {
	beforeAll(async () => {
		await seedFixtures();
		await bootServer();
	}, 120_000);

	afterAll(async () => {
		await cleanup();
	}, 30_000);

	describe("anonymous public surface", () => {
		it("home and category pages show only published articles", async () => {
			const home = await fetchText(baseUrl);
			expect(home).toContain("Boundary Public Article");
			expect(home).not.toContain("Boundary Draft Article");

			const category = await fetchText(`${baseUrl}/kb/boundary`);
			expect(category).toContain("Boundary Public Article");
			expect(category).not.toContain("Boundary Draft Article");
			expect(category).not.toContain("Boundary Archived Article");
		});

		it("draft and archived articles are not publicly reachable", async () => {
			const published = await fetch(`${baseUrl}/kb/boundary/boundary-public-article`);
			expect(published.status).toBe(200);
			expect(await published.text()).toContain("Boundary Public Article");

			const draft = await fetch(`${baseUrl}/kb/boundary/boundary-draft-article`);
			expect(draft.status).toBe(200);
			expect(await draft.text()).toContain("Article not found");

			const archived = await fetch(
				`${baseUrl}/kb/boundary/boundary-archived-article`,
			);
			expect(archived.status).toBe(200);
			expect(await archived.text()).toContain("Article not found");
		});

		it("downloads lists approved documents only", async () => {
			const html = await fetchText(`${baseUrl}/downloads`);
			expect(html).toContain("Boundary Approved Doc");
			expect(html).not.toContain("Boundary Pending Doc");
			expect(html).not.toContain("Boundary Archived Doc");
		});

		it("contacts lists active contacts only", async () => {
			const html = await fetchText(`${baseUrl}/staff-contacts`);
			expect(html).toContain("Boundary Active Contact");
			expect(html).not.toContain("Boundary Inactive Contact");
		});

		it("public search never surfaces draft content", async () => {
			const draftSearch = await fetchText(`${baseUrl}/search?q=Boundary+Draft`);
			expect(draftSearch).not.toContain("/kb/boundary/boundary-draft-article");

			const publicSearch = await fetchText(
				`${baseUrl}/search?q=Boundary+Public`,
			);
			expect(publicSearch).toContain("/kb/boundary/boundary-public-article");
		});
	});

	describe("internal routes redirect unauthenticated callers", () => {
		it.each([
			"/dashboard",
			"/categories",
			"/articles",
			"/articles/new",
			"/documents",
			"/documents/new",
			"/contacts",
			"/admin",
			"/admin/categories",
		])("%s redirects to /sign-in", async (routePath) => {
			const response = await fetch(`${baseUrl}${routePath}`, {
				redirect: "manual",
			});
			expect([302, 303, 307]).toContain(response.status);
			expect(response.headers.get("location")).toContain("/sign-in");
		});
	});

	describe("administration surface", () => {
		it("officers are redirected away from /admin", async () => {
			const jar = await signIn("officer@boundary.local");
			const response = await fetch(`${baseUrl}/admin`, {
				headers: { Cookie: jar.header() },
				redirect: "manual",
			});
			expect([302, 303, 307]).toContain(response.status);
			expect(response.headers.get("location")).toContain("/dashboard");
		});

		it("officers are rejected by the admin user API", async () => {
			const jar = await signIn("officer@boundary.local");
			const response = await fetch(`${baseUrl}/api/auth/admin/list-users`, {
				headers: { Cookie: jar.header() },
			});
			expect(response.status).toBe(403);
		});

		it("admins can open /admin and call the admin user API", async () => {
			const jar = await signIn("admin@boundary.local");
			const page = await fetch(`${baseUrl}/admin`, {
				headers: { Cookie: jar.header() },
			});
			expect(page.status).toBe(200);
			expect(await page.text()).toContain("Administration");

			const list = await fetch(`${baseUrl}/api/auth/admin/list-users`, {
				headers: { Cookie: jar.header() },
			});
			expect(list.status).toBe(200);
		});
	});
});
