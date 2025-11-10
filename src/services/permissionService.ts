import { pool } from '../config/db';

const BASE_PERMISSIONS = [
  'auth:register',
  'auth:login',
  'auth:google',
  'auth:refresh',
  'auth:token:validate',
  'sso:session:introspect',
];

const CLIENT_PERMISSIONS = [
  'client:dashboard:access',
  'client:shop:access',
  'client:shop:checkout',
  'client:finance:access',
  'client:engagement:access',
  'profile:self:read',
  'profile:self:update',
];

const ADMIN_PERMISSIONS = [
  'admin:backoffice:access',
  'admin:users:read',
  'admin:users:manage',
  'admin:products:manage',
  'admin:finance:overview',
  'analytics:global:read',
];

export async function getUserPermissions(userId: string): Promise<string[]> {
  const result = await pool.query<{ role: string }>('SELECT role FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) {
    return BASE_PERMISSIONS;
  }

  const role = result.rows[0].role as 'client' | 'admin';
  const permissions = new Set(BASE_PERMISSIONS);

  if (role === 'client') {
    for (const permission of CLIENT_PERMISSIONS) {
      permissions.add(permission);
    }
  }

  if (role === 'admin') {
    for (const permission of ADMIN_PERMISSIONS) {
      permissions.add(permission);
    }
  }

  return Array.from(permissions);
}
