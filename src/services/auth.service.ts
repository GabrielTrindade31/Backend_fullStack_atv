import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { AppError } from '../errors/AppError';
import { userRepository } from '../models/user.model';
import { env, validateEnv } from '../config/env';
import logger from '../utils/logger';

const passwordSchema = z
  .string()
  .min(8, 'A senha deve possuir pelo menos 8 caracteres.')
  .regex(/[A-Z]/, 'A senha deve possuir ao menos uma letra maiúscula.')
  .regex(/[a-z]/, 'A senha deve possuir ao menos uma letra minúscula.')
  .regex(/\d/, 'A senha deve possuir ao menos um número.')
  .regex(/[^A-Za-z0-9]/, 'A senha deve possuir ao menos um caractere especial.');

const registerSchema = z.object({
  name: z.string().min(3, 'O nome deve possuir ao menos 3 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(8, 'Senha inválida.'),
});

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokenPayload {
  token: string;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export class AuthService {
  constructor() {
    validateEnv();
  }

  async register(input: RegisterInput): Promise<AuthenticatedUser> {
    const payload = registerSchema.parse(input);

    logger.info('Iniciando registro de usuário', { email: payload.email });

    const existingUser = await userRepository.findByEmail(payload.email);

    if (existingUser) {
      logger.warn('Tentativa de registro com e-mail existente', { email: payload.email });
      throw new AppError('E-mail já cadastrado.', 422);
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);

    const user = await userRepository.create(payload.name, payload.email, hashedPassword);

    logger.info('Usuário registrado com sucesso', { userId: user.id });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  async login(input: LoginInput): Promise<AuthTokenPayload> {
    const payload = loginSchema.parse(input);

    logger.info('Tentativa de login recebida', { email: payload.email });

    const user = await userRepository.findByEmail(payload.email);

    if (!user) {
      logger.warn('Usuário não encontrado durante login', { email: payload.email });
      throw new AppError('Usuário não encontrado.', 404);
    }

    const passwordMatch = await bcrypt.compare(payload.password, user.password);

    if (!passwordMatch) {
      logger.warn('Senha inválida durante login', { email: payload.email });
      throw new AppError('Credenciais inválidas.', 401);
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
      },
      env.jwtSecret,
      {
        expiresIn: '1h',
      }
    );

    logger.info('Usuário autenticado com sucesso', { userId: user.id });

    return { token };
  }
}

export const authService = new AuthService();
