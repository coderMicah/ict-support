import { useState } from "react";
import { toast } from "sonner";

import { getErrorMessage } from "#/lib/errors";
import { type AdminUser, setUserRole } from "#/server/admin";

type UserManagementProps = {
	initialUsers: AdminUser[];
};

export function UserManagement({ initialUsers }: UserManagementProps) {
	const [users, setUsers] = useState(initialUsers);
	const [busyId, setBusyId] = useState<string | null>(null);

	const updateUser = (id: string, patch: Partial<AdminUser>) => {
		setUsers((prev) =>
			prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
		);
	};

	const onRoleChange = async (target: AdminUser, role: "admin" | "user") => {
		if (busyId || role === target.role) {
			return;
		}

		setBusyId(target.id);
		try {
			await setUserRole({ data: { userId: target.id, role } });
			updateUser(target.id, { role });
		} catch (error) {
			toast.error(getErrorMessage(error));
		} finally {
			setBusyId(null);
		}
	};

	return (
		<div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
			<table className="w-full min-w-[600px] text-sm">
				<thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wider text-neutral-500">
					<tr>
						<th className="px-4 py-3 font-medium">Name</th>
						<th className="px-4 py-3 font-medium">Email</th>
						<th className="px-4 py-3 font-medium">Role</th>
					</tr>
				</thead>
				<tbody>
					{users.map((row) => (
						<tr
							key={row.id}
							className="border-b border-neutral-200 last:border-0"
						>
							<td className="px-4 py-3 font-medium">{row.name}</td>
							<td className="px-4 py-3 text-neutral-500">{row.email}</td>
							<td className="px-4 py-3">
								<select
									value={row.role ?? "user"}
									disabled={busyId === row.id}
									onChange={(event) =>
										onRoleChange(row, event.target.value as "admin" | "user")
									}
									className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm capitalize"
								>
									<option value="user">User</option>
									<option value="admin">Admin</option>
								</select>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
