import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashOpaqueToken(token: string): Promise<string> {
  return bcrypt.hash(token, SALT_ROUNDS);
}

export async function verifyOpaqueToken(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash);
}
