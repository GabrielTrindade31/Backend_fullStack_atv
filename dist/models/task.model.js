"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskRepository = exports.TASK_STATUSES = void 0;
const database_1 = require("../database");
exports.TASK_STATUSES = ['pending', 'in_progress', 'completed'];
const mapTask = (row) => ({
    id: String(row.id),
    title: String(row.title),
    description: row.description === null || row.description === undefined ? null : String(row.description),
    status: String(row.status),
    dueDate: row.due_date ? new Date(String(row.due_date)) : null,
    userId: String(row.user_id),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
});
exports.taskRepository = {
    async create(data) {
        const result = await database_1.pool.query(`
        INSERT INTO tasks (title, description, status, due_date, user_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, title, description, status, due_date, user_id, created_at, updated_at
      `, [data.title, data.description ?? null, data.status, data.dueDate ?? null, data.userId]);
        return mapTask(result.rows[0]);
    },
    async listByUser(userId, filters) {
        const conditions = ['user_id = $1'];
        const params = [userId];
        let paramIndex = 2;
        if (filters.status) {
            conditions.push(`status = $${paramIndex}`);
            params.push(filters.status);
            paramIndex += 1;
        }
        if (filters.title) {
            conditions.push(`title ILIKE $${paramIndex}`);
            params.push(`%${filters.title}%`);
            paramIndex += 1;
        }
        if (filters.dueDate) {
            conditions.push(`DATE(due_date) = $${paramIndex}`);
            params.push(filters.dueDate.toISOString().slice(0, 10));
            paramIndex += 1;
        }
        const query = `
      SELECT id, title, description, status, due_date, user_id, created_at, updated_at
      FROM tasks
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
    `;
        const result = await database_1.pool.query(query, params);
        return result.rows.map(mapTask);
    },
    async findById(taskId) {
        const result = await database_1.pool.query(`
        SELECT id, title, description, status, due_date, user_id, created_at, updated_at
        FROM tasks
        WHERE id = $1
        LIMIT 1
      `, [taskId]);
        if (result.rowCount === 0) {
            return null;
        }
        return mapTask(result.rows[0]);
    },
    async update(taskId, data) {
        const result = await database_1.pool.query(`
        UPDATE tasks
        SET title = $1,
            description = $2,
            status = $3,
            due_date = $4,
            updated_at = NOW()
        WHERE id = $5
        RETURNING id, title, description, status, due_date, user_id, created_at, updated_at
      `, [data.title, data.description ?? null, data.status, data.dueDate ?? null, taskId]);
        if (result.rowCount === 0) {
            throw new Error('Task not found');
        }
        return mapTask(result.rows[0]);
    },
    async partialUpdate(taskId, data) {
        const fields = [];
        const params = [];
        let index = 1;
        if (data.title !== undefined) {
            fields.push(`title = $${index}`);
            params.push(data.title);
            index += 1;
        }
        if (data.description !== undefined) {
            fields.push(`description = $${index}`);
            params.push(data.description);
            index += 1;
        }
        if (data.status !== undefined) {
            fields.push(`status = $${index}`);
            params.push(data.status);
            index += 1;
        }
        if (data.dueDate !== undefined) {
            fields.push(`due_date = $${index}`);
            params.push(data.dueDate ?? null);
            index += 1;
        }
        fields.push(`updated_at = NOW()`);
        params.push(taskId);
        const result = await database_1.pool.query(`
        UPDATE tasks
        SET ${fields.join(', ')}
        WHERE id = $${index}
        RETURNING id, title, description, status, due_date, user_id, created_at, updated_at
      `, params);
        if (result.rowCount === 0) {
            throw new Error('Task not found');
        }
        return mapTask(result.rows[0]);
    },
    async delete(taskId) {
        const result = await database_1.pool.query(`
        DELETE FROM tasks
        WHERE id = $1
      `, [taskId]);
        return (result.rowCount ?? 0) > 0;
    },
};
//# sourceMappingURL=task.model.js.map