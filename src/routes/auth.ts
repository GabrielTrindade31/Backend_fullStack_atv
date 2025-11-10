import { Router } from 'express';
import { ZodError } from 'zod';
import { authenticate } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizationMiddleware';
import {
  getUserProfileWithPermissions,
  listUsers,
  loginLocalUser,
  loginWithGoogle,
  logoutByRefreshToken,
  refreshAuthSession,
  registerLocalUser,
} from '../services/authService';
import { verifyAccessToken } from '../utils/jwt';
import { googleSchema, loginSchema, refreshTokenSchema, registerSchema, validateTokenSchema } from '../utils/validators';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const payload = registerSchema.parse(req.body);
    const { confirmPassword: _confirmPassword, ...userData } = payload;
    const session = await registerLocalUser({
      email: userData.email,
      password: userData.password,
      name: userData.name,
      dateOfBirth: userData.dateOfBirth,
      role: userData.role,
    });
    res.status(201).json(session);
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
    const session = await loginLocalUser(payload);
    res.json(session);
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
    const session = await loginWithGoogle(payload.idToken);
    res.json(session);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: 'Dados inválidos.', issues: error.issues });
      return;
    }
    res.status(401).json({ message: (error as Error).message });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const payload = refreshTokenSchema.parse(req.body);
    const session = await refreshAuthSession(payload.refreshToken);
    res.json(session);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: 'Dados inválidos.', issues: error.issues });
      return;
    }
    res.status(401).json({ message: (error as Error).message });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const payload = refreshTokenSchema.parse(req.body);
    await logoutByRefreshToken(payload.refreshToken);
    res.status(204).send();
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: 'Dados inválidos.', issues: error.issues });
      return;
    }
    res.status(400).json({ message: (error as Error).message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Usuário não autenticado.' });
      return;
    }
    const data = await getUserProfileWithPermissions(req.userId);
    res.json(data);
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
});

router.post('/validate', async (req, res) => {
  try {
    const { token } = validateTokenSchema.parse(req.body);
    const payload = verifyAccessToken(token);
    const { user, permissions } = await getUserProfileWithPermissions(payload.sub);
    res.json({
      valid: true,
      user,
      permissions,
      token: {
        subject: payload.sub,
        email: payload.email ?? null,
        role: payload.role,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ valid: false, message: 'Token não informado.', issues: error.issues });
      return;
    }
    if ((error as Error).message === 'Usuário não encontrado.') {
      res.status(404).json({ valid: false, message: 'Usuário não encontrado.' });
      return;
    }
    res.status(401).json({ valid: false, message: 'Token inválido.' });
  }
});

router.get('/users', authenticate, authorizeRoles('admin'), async (_req, res) => {
  try {
    const users = await listUsers();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Falha ao listar usuários.', detail: (error as Error).message });
  }
});

router.get('/users/:id', authenticate, async (req, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Usuário não autenticado.' });
      return;
    }

    const { id } = req.params;

    if (req.userRole !== 'admin' && req.userId !== id) {
      res.status(403).json({ message: 'Usuário sem permissão para acessar este perfil.' });
      return;
    }

    const data = await getUserProfileWithPermissions(id);
    res.json(data);
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
});

export default router;
