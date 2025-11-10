import { z } from 'zod';
import { AppError } from '../errors/AppError';
import { TaskRecord, taskRepository, TASK_STATUSES } from '../models/task.model';
import logger from '../utils/logger';

const statusEnum = z.enum(TASK_STATUSES);
const descriptionSchema = z
  .string({ invalid_type_error: 'A descrição deve ser uma string.' })
  .max(500, 'A descrição deve conter no máximo 500 caracteres.');
const dueDateSchema = z
  .union([
    z
      .string({ invalid_type_error: 'A data de vencimento deve ser uma string.' })
      .datetime({ message: 'A data de vencimento deve estar no formato ISO 8601.' })
      .transform((value) => new Date(value)),
    z.null(),
  ])
  .optional();

const createTaskSchema = z.object({
  title: z
    .string({ invalid_type_error: 'O título deve ser uma string.' })
    .min(3, 'O título deve conter ao menos 3 caracteres.'),
  description: descriptionSchema.optional(),
  status: statusEnum.optional(),
  dueDate: dueDateSchema,
});

const putTaskSchema = z.object({
  title: z
    .string({ invalid_type_error: 'O título deve ser uma string.' })
    .min(3, 'O título deve conter ao menos 3 caracteres.'),
  description: descriptionSchema.optional(),
  status: statusEnum,
  dueDate: dueDateSchema,
});

const patchTaskSchema = z
  .object({
    title: z
      .string({ invalid_type_error: 'O título deve ser uma string.' })
      .min(3, 'O título deve conter ao menos 3 caracteres.')
      .optional(),
    description: descriptionSchema.optional(),
    status: statusEnum.optional(),
    dueDate: dueDateSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualização.',
  });

const listTasksQuerySchema = z
  .object({
    status: statusEnum.optional(),
    title: z
      .string({ invalid_type_error: 'O filtro de título deve ser uma string.' })
      .min(1, 'Informe ao menos um caractere para o filtro de título.')
      .optional(),
    dueDate: dueDateSchema,
  })
  .strip();

const normalizeDueDate = (value?: Date | null): Date | undefined => {
  if (!value) {
    return undefined;
  }

  return value instanceof Date ? value : undefined;
};

const ensureValidId = (taskId: string): void => {
  try {
    z.string().uuid().parse(taskId);
  } catch {
    throw new AppError('Identificador de tarefa inválido.', 400);
  }
};

const ensureOwnership = (task: TaskRecord, userId: string): void => {
  if (task.userId !== userId) {
    logger.warn('Tentativa de acesso a tarefa de outro usuário.', {
      taskId: task.id,
      ownerId: task.userId,
      requesterId: userId,
    });
    throw new AppError('Você não tem permissão para acessar este recurso.', 403);
  }
};

export class TaskService {
  async createTask(userId: string, payload: unknown): Promise<TaskRecord> {
    const data = createTaskSchema.parse(payload);

    const task = await taskRepository.create({
      title: data.title,
      description: data.description,
      status: data.status ?? 'pending',
      dueDate: normalizeDueDate(data.dueDate ?? undefined) ?? null,
      userId,
    });

    logger.info('Tarefa criada com sucesso.', { userId, taskId: task.id });
    return task;
  }

  async listTasks(userId: string, query: unknown): Promise<TaskRecord[]> {
    const filters = listTasksQuerySchema.parse(query ?? {});
    const tasks = await taskRepository.listByUser(userId, {
      status: filters.status,
      title: filters.title,
      dueDate: filters.dueDate ? new Date(filters.dueDate) : undefined,
    });
    logger.debug('Listagem de tarefas executada.', {
      userId,
      filters,
      count: tasks.length,
    });
    return tasks;
  }

  async getTaskById(userId: string, taskId: string): Promise<TaskRecord> {
    ensureValidId(taskId);
    const task = await taskRepository.findById(taskId);

    if (!task) {
      throw new AppError('Tarefa não encontrada.', 404);
    }

    ensureOwnership(task, userId);

    logger.debug('Tarefa recuperada com sucesso.', { userId, taskId: task.id });
    return task;
  }

  async updateTask(userId: string, taskId: string, payload: unknown): Promise<TaskRecord> {
    ensureValidId(taskId);
    const data = putTaskSchema.parse(payload);

    const task = await taskRepository.findById(taskId);

    if (!task) {
      throw new AppError('Tarefa não encontrada.', 404);
    }

    ensureOwnership(task, userId);

    const updatedTask = await taskRepository.update(taskId, {
      title: data.title,
      description: data.description,
      status: data.status,
      dueDate: normalizeDueDate(data.dueDate ?? undefined) ?? null,
    });

    logger.info('Tarefa atualizada (PUT) com sucesso.', { userId, taskId: updatedTask.id });
    return updatedTask;
  }

  async partiallyUpdateTask(
    userId: string,
    taskId: string,
    payload: unknown
  ): Promise<TaskRecord> {
    ensureValidId(taskId);
    const data = patchTaskSchema.parse(payload);

    const task = await taskRepository.findById(taskId);

    if (!task) {
      throw new AppError('Tarefa não encontrada.', 404);
    }

    ensureOwnership(task, userId);

    const updatedTask = await taskRepository.partialUpdate(taskId, {
      title: data.title,
      description: data.description,
      status: data.status,
      dueDate: data.dueDate !== undefined ? normalizeDueDate(data.dueDate ?? undefined) ?? null : undefined,
    });

    logger.info('Tarefa atualizada (PATCH) com sucesso.', { userId, taskId: updatedTask.id });
    return updatedTask;
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    ensureValidId(taskId);
    const task = await taskRepository.findById(taskId);

    if (!task) {
      throw new AppError('Tarefa não encontrada.', 404);
    }

    ensureOwnership(task, userId);

    const deleted = await taskRepository.delete(taskId);

    if (!deleted) {
      throw new AppError('Tarefa não encontrada.', 404);
    }

    logger.info('Tarefa removida com sucesso.', { userId, taskId: task.id });
  }
}

export const taskService = new TaskService();
