"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskService = exports.TaskService = void 0;
const zod_1 = require("zod");
const AppError_1 = require("../errors/AppError");
const task_model_1 = require("../models/task.model");
const logger_1 = __importDefault(require("../utils/logger"));
const statusEnum = zod_1.z.enum(task_model_1.TASK_STATUSES);
const descriptionSchema = zod_1.z
    .string({ invalid_type_error: 'A descrição deve ser uma string.' })
    .max(500, 'A descrição deve conter no máximo 500 caracteres.');
const dueDateSchema = zod_1.z
    .union([
    zod_1.z
        .string({ invalid_type_error: 'A data de vencimento deve ser uma string.' })
        .datetime({ message: 'A data de vencimento deve estar no formato ISO 8601.' })
        .transform((value) => new Date(value)),
    zod_1.z.null(),
])
    .optional();
const createTaskSchema = zod_1.z.object({
    title: zod_1.z
        .string({ invalid_type_error: 'O título deve ser uma string.' })
        .min(3, 'O título deve conter ao menos 3 caracteres.'),
    description: descriptionSchema.optional(),
    status: statusEnum.optional(),
    dueDate: dueDateSchema,
});
const putTaskSchema = zod_1.z.object({
    title: zod_1.z
        .string({ invalid_type_error: 'O título deve ser uma string.' })
        .min(3, 'O título deve conter ao menos 3 caracteres.'),
    description: descriptionSchema.optional(),
    status: statusEnum,
    dueDate: dueDateSchema,
});
const patchTaskSchema = zod_1.z
    .object({
    title: zod_1.z
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
const listTasksQuerySchema = zod_1.z
    .object({
    status: statusEnum.optional(),
    title: zod_1.z
        .string({ invalid_type_error: 'O filtro de título deve ser uma string.' })
        .min(1, 'Informe ao menos um caractere para o filtro de título.')
        .optional(),
    dueDate: dueDateSchema,
})
    .strip();
const normalizeDueDate = (value) => {
    if (!value) {
        return undefined;
    }
    return value instanceof Date ? value : undefined;
};
const ensureValidId = (taskId) => {
    try {
        zod_1.z.string().uuid().parse(taskId);
    }
    catch {
        throw new AppError_1.AppError('Identificador de tarefa inválido.', 400);
    }
};
const ensureOwnership = (task, userId) => {
    if (task.userId !== userId) {
        logger_1.default.warn('Tentativa de acesso a tarefa de outro usuário.', {
            taskId: task.id,
            ownerId: task.userId,
            requesterId: userId,
        });
        throw new AppError_1.AppError('Você não tem permissão para acessar este recurso.', 403);
    }
};
class TaskService {
    async createTask(userId, payload) {
        const data = createTaskSchema.parse(payload);
        const task = await task_model_1.taskRepository.create({
            title: data.title,
            description: data.description,
            status: data.status ?? 'pending',
            dueDate: normalizeDueDate(data.dueDate ?? undefined) ?? null,
            userId,
        });
        logger_1.default.info('Tarefa criada com sucesso.', { userId, taskId: task.id });
        return task;
    }
    async listTasks(userId, query) {
        const filters = listTasksQuerySchema.parse(query ?? {});
        const tasks = await task_model_1.taskRepository.listByUser(userId, {
            status: filters.status,
            title: filters.title,
            dueDate: filters.dueDate ? new Date(filters.dueDate) : undefined,
        });
        logger_1.default.debug('Listagem de tarefas executada.', {
            userId,
            filters,
            count: tasks.length,
        });
        return tasks;
    }
    async getTaskById(userId, taskId) {
        ensureValidId(taskId);
        const task = await task_model_1.taskRepository.findById(taskId);
        if (!task) {
            throw new AppError_1.AppError('Tarefa não encontrada.', 404);
        }
        ensureOwnership(task, userId);
        logger_1.default.debug('Tarefa recuperada com sucesso.', { userId, taskId: task.id });
        return task;
    }
    async updateTask(userId, taskId, payload) {
        ensureValidId(taskId);
        const data = putTaskSchema.parse(payload);
        const task = await task_model_1.taskRepository.findById(taskId);
        if (!task) {
            throw new AppError_1.AppError('Tarefa não encontrada.', 404);
        }
        ensureOwnership(task, userId);
        const updatedTask = await task_model_1.taskRepository.update(taskId, {
            title: data.title,
            description: data.description,
            status: data.status,
            dueDate: normalizeDueDate(data.dueDate ?? undefined) ?? null,
        });
        logger_1.default.info('Tarefa atualizada (PUT) com sucesso.', { userId, taskId: updatedTask.id });
        return updatedTask;
    }
    async partiallyUpdateTask(userId, taskId, payload) {
        ensureValidId(taskId);
        const data = patchTaskSchema.parse(payload);
        const task = await task_model_1.taskRepository.findById(taskId);
        if (!task) {
            throw new AppError_1.AppError('Tarefa não encontrada.', 404);
        }
        ensureOwnership(task, userId);
        const updatedTask = await task_model_1.taskRepository.partialUpdate(taskId, {
            title: data.title,
            description: data.description,
            status: data.status,
            dueDate: data.dueDate !== undefined ? normalizeDueDate(data.dueDate ?? undefined) ?? null : undefined,
        });
        logger_1.default.info('Tarefa atualizada (PATCH) com sucesso.', { userId, taskId: updatedTask.id });
        return updatedTask;
    }
    async deleteTask(userId, taskId) {
        ensureValidId(taskId);
        const task = await task_model_1.taskRepository.findById(taskId);
        if (!task) {
            throw new AppError_1.AppError('Tarefa não encontrada.', 404);
        }
        ensureOwnership(task, userId);
        const deleted = await task_model_1.taskRepository.delete(taskId);
        if (!deleted) {
            throw new AppError_1.AppError('Tarefa não encontrada.', 404);
        }
        logger_1.default.info('Tarefa removida com sucesso.', { userId, taskId: task.id });
    }
}
exports.TaskService = TaskService;
exports.taskService = new TaskService();
//# sourceMappingURL=task.service.js.map