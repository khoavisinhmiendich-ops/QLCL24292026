export type Role = "ADMIN" | "MANAGER" | "USER" | "VIEWER";
export type Action = "read" | "write" | "manage" | "admin";
const RANK: Record<Role, number> = { VIEWER: 0, USER: 1, MANAGER: 2, ADMIN: 3 };
const NEED: Record<Action, number> = { read: 0, write: 1, manage: 2, admin: 3 };
export const can = (role: Role, action: Action) => RANK[role] >= NEED[action];
