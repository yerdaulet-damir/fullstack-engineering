import { forbidden, unauthorized } from "./errors.mjs";

const permissionsByRole = {
  owner: new Set(["issue:read", "issue:write", "job:enqueue", "job:run", "job:read", "audit:read"]),
  admin: new Set(["issue:read", "issue:write", "job:enqueue", "job:run", "job:read", "audit:read"]),
  member: new Set(["issue:read", "issue:write", "job:enqueue"]),
  viewer: new Set(["issue:read"])
};

export class AuthorizationPolicy {
  constructor(repository) {
    this.repository = repository;
  }

  require(principal, permission) {
    if (!principal?.userId || !principal?.tenantId) throw unauthorized();
    const tenant = this.repository.getTenant({ tenantId: principal.tenantId });
    const membership = this.repository.getMembership({ tenantId: principal.tenantId, userId: principal.userId });
    if (!tenant || membership?.status !== "active" || !permissionsByRole[membership.role]?.has(permission)) throw forbidden();
    return Object.freeze({ tenantId: tenant.id, tenantName: tenant.name, userId: membership.userId, role: membership.role });
  }
}
