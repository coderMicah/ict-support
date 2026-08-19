import { z } from "zod";

export const adminUserIdSchema = z.object({
	userId: z.string().min(1, "User ID is required."),
});

export const setUserRoleSchema = adminUserIdSchema.extend({
	role: z.enum(["admin", "user"]),
});
