"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const task_controller_1 = require("../controllers/task.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const taskRouter = (0, express_1.Router)();
/**
 * @openapi
 * /tasks:
 *   post:
 *     summary: Cria uma nova tarefa para o usuário autenticado
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Data em ISO 8601
 *     responses:
 *       201: { description: Tarefa criada }
 *       401: { description: Token ausente ou inválido }
 */
taskRouter.post('/tasks', auth_middleware_1.authenticateToken, (req, res, next) => task_controller_1.taskController.create(req, res, next));
/**
 * @openapi
 * /tasks:
 *   get:
 *     summary: Lista tarefas do usuário autenticado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed]
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Filtro parcial (case insensitive) pelo título
 *       - in: query
 *         name: dueDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200: { description: Lista de tarefas retornada }
 *       401: { description: Token ausente ou inválido }
 */
taskRouter.get('/tasks', auth_middleware_1.authenticateToken, (req, res, next) => task_controller_1.taskController.list(req, res, next));
/**
 * @openapi
 * /tasks/{id}:
 *   get:
 *     summary: Retorna os detalhes de uma tarefa específica
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200: { description: Tarefa retornada }
 *       401: { description: Token ausente ou inválido }
 *       403: { description: Acesso não autorizado ao recurso }
 *       404: { description: Tarefa não encontrada }
 */
taskRouter.get('/tasks/:id', auth_middleware_1.authenticateToken, (req, res, next) => task_controller_1.taskController.getById(req, res, next));
/**
 * @openapi
 * /tasks/{id}:
 *   put:
 *     summary: Atualiza completamente uma tarefa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, status]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200: { description: Tarefa atualizada }
 *       401: { description: Token ausente ou inválido }
 *       403: { description: Acesso não autorizado ao recurso }
 *       404: { description: Tarefa não encontrada }
 */
taskRouter.put('/tasks/:id', auth_middleware_1.authenticateToken, (req, res, next) => task_controller_1.taskController.update(req, res, next));
/**
 * @openapi
 * /tasks/{id}:
 *   patch:
 *     summary: Atualiza parcialmente uma tarefa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200: { description: Tarefa atualizada }
 *       401: { description: Token ausente ou inválido }
 *       403: { description: Acesso não autorizado ao recurso }
 *       404: { description: Tarefa não encontrada }
 */
taskRouter.patch('/tasks/:id', auth_middleware_1.authenticateToken, (req, res, next) => task_controller_1.taskController.partialUpdate(req, res, next));
/**
 * @openapi
 * /tasks/{id}:
 *   delete:
 *     summary: Remove uma tarefa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204: { description: Tarefa removida }
 *       401: { description: Token ausente ou inválido }
 *       403: { description: Acesso não autorizado ao recurso }
 *       404: { description: Tarefa não encontrada }
 */
taskRouter.delete('/tasks/:id', auth_middleware_1.authenticateToken, (req, res, next) => task_controller_1.taskController.delete(req, res, next));
exports.default = taskRouter;
//# sourceMappingURL=task.routes.js.map