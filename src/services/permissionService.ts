import { pool } from '../config/db';

const BASE_PERMISSIONS = [
  'auth:register',
  'auth:login',
  'auth:token:validate',
  'profile:read',
  'app:navigation:standard',
];

const BACKLOG_PERMISSIONS = ['backlog:access'];

export async function getUserPermissions(userId: string): Promise<string[]> {
  const result = await pool.query<{ role: string }>('SELECT role FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) {
    return BASE_PERMISSIONS;
  }

  const role = result.rows[0].role as 'user' | 'backlog';
  const permissions = new Set(BASE_PERMISSIONS);

  if (role === 'backlog') {
    for (const permission of BACKLOG_PERMISSIONS) {
      permissions.add(permission);
    }
  }

  return Array.from(permissions);
}
