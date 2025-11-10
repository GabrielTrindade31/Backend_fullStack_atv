import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { env } from '../config/env';

const client = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

export async function verifyGoogleToken(idToken: string): Promise<TokenPayload> {
  if (!env.googleClientId) {
    throw new Error('GOOGLE_CLIENT_ID não configurado.');
  }

  if (!client) {
    throw new Error('Cliente Google OAuth não disponível.');
  }

  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Token do Google inválido.');
  }
  return payload;
}
