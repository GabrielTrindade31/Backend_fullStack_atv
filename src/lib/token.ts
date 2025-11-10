import crypto from 'crypto';

export function generateRefreshTokenValue(): string {
  return crypto.randomUUID() + crypto.randomBytes(24).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
