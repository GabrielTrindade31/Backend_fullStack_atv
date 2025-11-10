import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { taskService } from '../services/task.service';
import logger from '../utils/logger';
import { AppError } from '../errors/AppError';

class TaskController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Token inválido.', 401);
      }

      const task = await taskService.createTask(userId, req.body);
      logger.debug('Respondendo criação de tarefa.', { userId, taskId: task.id });
      return res.status(201).json({
        message: 'Tarefa criada com sucesso.',
        task,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Token inválido.', 401);
      }

      const tasks = await taskService.listTasks(userId, req.query);
      return res.status(200).json({ tasks });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Token inválido.', 401);
      }

      const task = await taskService.getTaskById(userId, req.params.id);
      return res.status(200).json({ task });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Token inválido.', 401);
      }

      const task = await taskService.updateTask(userId, req.params.id, req.body);
      return res.status(200).json({
        message: 'Tarefa atualizada com sucesso.',
        task,
      });
    } catch (error) {
      next(error);
    }
  }

  async partialUpdate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Token inválido.', 401);
      }

      const task = await taskService.partiallyUpdateTask(userId, req.params.id, req.body);
      return res.status(200).json({
        message: 'Tarefa atualizada com sucesso.',
        task,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Token inválido.', 401);
      }

      await taskService.deleteTask(userId, req.params.id);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController();
