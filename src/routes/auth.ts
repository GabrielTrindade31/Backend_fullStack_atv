import { Router } from 'express';
import { ZodError } from 'zod';
import { authenticate } from '../middlewares/authMiddleware';
import { getUserProfile, loginLocalUser, loginWithGoogle, registerLocalUser } from '../services/authService';
import { verifyAccessToken } from '../utils/jwt';
import { googleSchema, loginSchema, registerSchema } from '../utils/validators';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const payload = registerSchema.parse(req.body);
    const response = await registerLocalUser({
      email: payload.email,
      password: payload.password,
      name: payload.name,
      dateOfBirth: payload.dateOfBirth,
    });
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: 'Dados inválidos.', issues: error.issues });
      return;
    }
    res.status(400).json({ message: (error as Error).message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const payload = loginSchema.parse(req.body);
    const response = await loginLocalUser(payload);
    res.json(response);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: 'Dados inválidos.', issues: error.issues });
      return;
    }
    res.status(401).json({ message: (error as Error).message });
  }
});

router.post('/google', async (req, res) => {
  try {
    const payload = googleSchema.parse(req.body);
    const response = await loginWithGoogle(payload.idToken);
    res.json(response);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: 'Dados inválidos.', issues: error.issues });
      return;
    }
    res.status(401).json({ message: (error as Error).message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Usuário não autenticado.' });
      return;
    }
    const user = await getUserProfile(req.userId);
    res.json({ user });
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
});

router.post('/validate', (req, res) => {
  const { token } = req.body as { token?: string };
  if (!token) {
    res.status(400).json({ valid: false, message: 'Token não informado.' });
    return;
  }

  try {
    const { sub, email } = verifyAccessToken(token);
    res.json({ valid: true, userId: sub, email });
  } catch (error) {
    res.status(401).json({ valid: false, message: 'Token inválido.' });
  }
});

export default router;
