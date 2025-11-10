import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../core/errors/AppError';
import { httpStatus } from '../core/http/httpStatus';

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message, details: error.details ?? null });
    return;
  }

  if (error instanceof ZodError) {
    res.status(httpStatus.badRequest).json({
      message: 'Dados inválidos.',
      issues: error.issues,
    });
    return;
  }

  console.error(error);
  res.status(httpStatus.internalServerError).json({ message: 'Erro interno do servidor.' });
}
