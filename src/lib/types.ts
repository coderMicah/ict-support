export type PortalUser = {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	role: string | null;
	approved: boolean;
	canPublish: boolean;
	createdAt: Date;
	updatedAt: Date;
};
