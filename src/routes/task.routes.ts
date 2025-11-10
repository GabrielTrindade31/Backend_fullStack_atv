import { Router } from 'express';
import { taskController } from '../controllers/task.controller';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth.middleware';

const taskRouter = Router();

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
taskRouter.post('/tasks', authenticateToken, (req, res, next) =>
  taskController.create(req as AuthenticatedRequest, res, next)
);

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
taskRouter.get('/tasks', authenticateToken, (req, res, next) =>
  taskController.list(req as AuthenticatedRequest, res, next)
);

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
taskRouter.get('/tasks/:id', authenticateToken, (req, res, next) =>
  taskController.getById(req as AuthenticatedRequest, res, next)
);

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
taskRouter.put('/tasks/:id', authenticateToken, (req, res, next) =>
  taskController.update(req as AuthenticatedRequest, res, next)
);

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
taskRouter.patch('/tasks/:id', authenticateToken, (req, res, next) =>
  taskController.partialUpdate(req as AuthenticatedRequest, res, next)
);

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
taskRouter.delete('/tasks/:id', authenticateToken, (req, res, next) =>
  taskController.delete(req as AuthenticatedRequest, res, next)
);

export default taskRouter;
