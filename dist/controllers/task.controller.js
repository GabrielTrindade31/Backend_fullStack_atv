"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskController = void 0;
const task_service_1 = require("../services/task.service");
const logger_1 = __importDefault(require("../utils/logger"));
const AppError_1 = require("../errors/AppError");
class TaskController {
    async create(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new AppError_1.AppError('Token inválido.', 401);
            }
            const task = await task_service_1.taskService.createTask(userId, req.body);
            logger_1.default.debug('Respondendo criação de tarefa.', { userId, taskId: task.id });
            return res.status(201).json({
                message: 'Tarefa criada com sucesso.',
                task,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async list(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new AppError_1.AppError('Token inválido.', 401);
            }
            const tasks = await task_service_1.taskService.listTasks(userId, req.query);
            return res.status(200).json({ tasks });
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new AppError_1.AppError('Token inválido.', 401);
            }
            const task = await task_service_1.taskService.getTaskById(userId, req.params.id);
            return res.status(200).json({ task });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new AppError_1.AppError('Token inválido.', 401);
            }
            const task = await task_service_1.taskService.updateTask(userId, req.params.id, req.body);
            return res.status(200).json({
                message: 'Tarefa atualizada com sucesso.',
                task,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async partialUpdate(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new AppError_1.AppError('Token inválido.', 401);
            }
            const task = await task_service_1.taskService.partiallyUpdateTask(userId, req.params.id, req.body);
            return res.status(200).json({
                message: 'Tarefa atualizada com sucesso.',
                task,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new AppError_1.AppError('Token inválido.', 401);
            }
            await task_service_1.taskService.deleteTask(userId, req.params.id);
            return res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
}
exports.taskController = new TaskController();
//# sourceMappingURL=task.controller.js.map