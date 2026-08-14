import { useState } from "react";

import { type AdminUser, setUserApproval, setUserRole } from "#/server/admin";

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

	const onToggleApproval = async (target: AdminUser) => {
		if (busyId) {
			return;
		}

		setBusyId(target.id);
		try {
			await setUserApproval({
				data: {
					userId: target.id,
					approved: !target.approved,
				},
			});
			updateUser(target.id, { approved: !target.approved });
		} finally {
			setBusyId(null);
		}
	};

	const onRoleChange = async (target: AdminUser, role: "admin" | "user") => {
		if (busyId || role === target.role) {
			return;
		}

		setBusyId(target.id);
		try {
			await setUserRole({ data: { userId: target.id, role } });
			updateUser(target.id, { role });
		} finally {
			setBusyId(null);
		}
	};

	return (
		<div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
			<table className="w-full min-w-[680px] text-sm">
				<thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wider text-neutral-500">
					<tr>
						<th className="px-4 py-3 font-medium">Name</th>
						<th className="px-4 py-3 font-medium">Email</th>
						<th className="px-4 py-3 font-medium">Role</th>
						<th className="px-4 py-3 font-medium">Status</th>
						<th className="px-4 py-3 font-medium">Actions</th>
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
							<td className="px-4 py-3">
								{row.approved ? (
									<span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
										Approved
									</span>
								) : (
									<span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
										Pending
									</span>
								)}
							</td>
							<td className="px-4 py-3">
								<button
									type="button"
									disabled={busyId === row.id}
									onClick={() => onToggleApproval(row)}
									className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-sm font-medium transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
								>
									{row.approved ? "Revoke approval" : "Approve"}
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
