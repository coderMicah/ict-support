import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { ac, roles } from "#/lib/access-control";

export const authClient = createAuthClient({
	plugins: [
		adminClient({
			ac,
			roles,
		}),
	],
});

export const { signIn, signUp, signOut, useSession } = authClient;
