import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório.'),
    email: z.string().email('E-mail inválido.'),
    password: z.string().min(6, 'Senha deve possuir pelo menos 6 caracteres.'),
    confirmPassword: z.string().min(6, 'Confirmação de senha é obrigatória.'),
    dateOfBirth: z.string().optional(),
    role: z.enum(['client', 'admin']).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Senhas não coincidem.',
  });

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(1, 'Senha é obrigatória.'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Token de atualização é obrigatório.'),
});

export const validateTokenSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório.'),
});

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, 'Token do Google é obrigatório.'),
});
