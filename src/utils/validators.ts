import { z } from 'zod';

const dateSchema = z
  .string()
  .trim()
  .min(1, 'Data de nascimento inválida.')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Data de nascimento inválida.');

export const registerSchema = z.object({
  email: z.string({ required_error: 'E-mail é obrigatório.' }).email('E-mail inválido.'),
  password: z
    .string({ required_error: 'Senha é obrigatória.' })
    .min(8, 'A senha deve ter pelo menos 8 caracteres.'),
  name: z.string({ required_error: 'Nome é obrigatório.' }).min(2, 'Informe um nome válido.'),
  dateOfBirth: z.union([dateSchema, z.literal(null), z.undefined()]).transform((value) => {
    if (value === undefined) {
      return null;
    }
    return value;
  }),
});

export const loginSchema = z.object({
  email: z.string({ required_error: 'E-mail é obrigatório.' }).email('E-mail inválido.'),
  password: z.string({ required_error: 'Senha é obrigatória.' }),
});

export const googleSchema = z.object({
  idToken: z.string({ required_error: 'Token do Google é obrigatório.' }),
});
