import { config } from "dotenv";
import { eq } from "drizzle-orm";

config({ path: [".env.local", ".env"] });

const [{ db }, { user }, { auth }] = await Promise.all([
	import("../src/db"),
	import("../src/db/schema"),
	import("../src/lib/auth"),
]);

const seeds = [
	{
		email: process.env.ADMIN_EMAIL ?? "admin@ict.local",
		password: process.env.ADMIN_PASSWORD ?? "AdminPass123!",
		name: process.env.ADMIN_NAME ?? "Head of ICT",
		role: "admin",
	},
	{
		email: process.env.USER_EMAIL ?? "user@ict.local",
		password: process.env.USER_PASSWORD ?? "UserPass123!",
		name: process.env.USER_NAME ?? "Portal User",
		role: "user",
	},
] as const;

async function main() {
	for (const seed of seeds) {
		const existing = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.email, seed.email))
			.limit(1);

		if (existing[0]) {
			await db
				.update(user)
				.set({ role: seed.role, approved: true })
				.where(eq(user.id, existing[0].id));
			console.log(`[seed] ${seed.email} already exists (role: ${seed.role})`);
			continue;
		}

		const result = await auth.api.signUpEmail({
			body: {
				name: seed.name,
				email: seed.email,
				password: seed.password,
			},
			headers: new Headers(),
		});

		if (!result.user) {
			throw new Error(`Failed to create user ${seed.email}`);
		}

		await db
			.update(user)
			.set({ role: seed.role, approved: true })
			.where(eq(user.id, result.user.id));
		console.log(`[seed] created ${seed.email} (role: ${seed.role})`);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
