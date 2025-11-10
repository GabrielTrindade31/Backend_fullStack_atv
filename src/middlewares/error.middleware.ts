import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import logger from '../utils/logger';

export const errorMiddleware = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  if (error instanceof AppError) {
    logger.error(error.message, { statusCode: error.statusCode, details: error.details });
    return res.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
  }

  if (error instanceof ZodError) {
    logger.warn('Erro de validação', { issues: error.issues });
    return res.status(422).json({
      message: 'Erro de validação',
      issues: error.issues,
    });
  }

  logger.error('Erro interno não tratado', { error });
  return res.status(500).json({ message: 'Erro interno do servidor.' });
};
