import { Router } from 'express';
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  validateTokenSchema,
  googleLoginSchema,
} from './auth.schemas';
import {
  getProfile,
  listUsers,
  loginWithGoogle,
  loginWithPassword,
  logout,
  refreshSession,
  registerUser,
  validateAccessToken,
} from './auth.service';
import { authenticate } from '../../middlewares/authenticate';
import { ensureRole } from '../../middlewares/ensureRole';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    const session = await registerUser({
      name: payload.name,
      email: payload.email,
      password: payload.password,
      dateOfBirth: payload.dateOfBirth,
      role: payload.role,
    });

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const session = await loginWithPassword(payload);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

router.post('/google', async (req, res, next) => {
  try {
    const payload = googleLoginSchema.parse(req.body);
    const session = await loginWithGoogle(payload.idToken);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const payload = refreshTokenSchema.parse(req.body);
    const session = await refreshSession(payload.refreshToken);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const payload = refreshTokenSchema.parse(req.body);
    await logout(payload.refreshToken);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new Error('Usuário não autenticado.');
    }

    const user = await getProfile(req.auth.userId);
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

router.post('/validate', async (req, res, next) => {
  try {
    const payload = validateTokenSchema.parse(req.body);
    const result = await validateAccessToken(payload.token);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/users', authenticate, ensureRole('admin'), async (_req, res, next) => {
  try {
    const users = await listUsers();
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

router.get('/users/:id', authenticate, async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new Error('Usuário não autenticado.');
    }

    const { id } = req.params;

    if (req.auth.role !== 'admin' && req.auth.userId !== id) {
      res.status(403).json({ message: 'Usuário sem permissão para acessar este recurso.' });
      return;
    }

    const user = await getProfile(id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export const authRouter = router;
