import { z } from "zod";

export const adminUserIdSchema = z.object({
	userId: z.string().min(1, "User ID is required."),
});

export const setUserApprovalSchema = adminUserIdSchema.extend({
	approved: z.boolean(),
});

export const setUserRoleSchema = adminUserIdSchema.extend({
	role: z.enum(["admin", "user"]),
});

export const setPublishPermissionSchema = adminUserIdSchema.extend({
	canPublish: z.boolean(),
});
