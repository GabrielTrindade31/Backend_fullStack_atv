import { pool } from '../database';

export const TASK_STATUSES = ['pending', 'in_progress', 'completed'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface TaskRecord {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: Date | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const mapTask = (row: Record<string, unknown>): TaskRecord => ({
  id: String(row.id),
  title: String(row.title),
  description: row.description === null || row.description === undefined ? null : String(row.description),
  status: String(row.status) as TaskStatus,
  dueDate: row.due_date ? new Date(String(row.due_date)) : null,
  userId: String(row.user_id),
  createdAt: new Date(String(row.created_at)),
  updatedAt: new Date(String(row.updated_at)),
});

export const taskRepository = {
  async create(data: {
    title: string;
    description?: string | null;
    status: TaskStatus;
    dueDate?: Date | null;
    userId: string;
  }): Promise<TaskRecord> {
    const result = await pool.query(
      `
        INSERT INTO tasks (title, description, status, due_date, user_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, title, description, status, due_date, user_id, created_at, updated_at
      `,
      [data.title, data.description ?? null, data.status, data.dueDate ?? null, data.userId]
    );

    return mapTask(result.rows[0]);
  },

  async listByUser(
    userId: string,
    filters: {
      status?: TaskStatus;
      title?: string;
      dueDate?: Date;
    }
  ): Promise<TaskRecord[]> {
    const conditions: string[] = ['user_id = $1'];
    const params: unknown[] = [userId];
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

    const result = await pool.query(query, params);
    return result.rows.map(mapTask);
  },

  async findById(taskId: string): Promise<TaskRecord | null> {
    const result = await pool.query(
      `
        SELECT id, title, description, status, due_date, user_id, created_at, updated_at
        FROM tasks
        WHERE id = $1
        LIMIT 1
      `,
      [taskId]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return mapTask(result.rows[0]);
  },

  async update(
    taskId: string,
    data: {
      title: string;
      description?: string | null;
      status: TaskStatus;
      dueDate?: Date | null;
    }
  ): Promise<TaskRecord> {
    const result = await pool.query(
      `
        UPDATE tasks
        SET title = $1,
            description = $2,
            status = $3,
            due_date = $4,
            updated_at = NOW()
        WHERE id = $5
        RETURNING id, title, description, status, due_date, user_id, created_at, updated_at
      `,
      [data.title, data.description ?? null, data.status, data.dueDate ?? null, taskId]
    );

    if (result.rowCount === 0) {
      throw new Error('Task not found');
    }

    return mapTask(result.rows[0]);
  },

  async partialUpdate(
    taskId: string,
    data: {
      title?: string;
      description?: string | null;
      status?: TaskStatus;
      dueDate?: Date | null;
    }
  ): Promise<TaskRecord> {
    const fields: string[] = [];
    const params: unknown[] = [];
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

    const result = await pool.query(
      `
        UPDATE tasks
        SET ${fields.join(', ')}
        WHERE id = $${index}
        RETURNING id, title, description, status, due_date, user_id, created_at, updated_at
      `,
      params
    );

    if (result.rowCount === 0) {
      throw new Error('Task not found');
    }

    return mapTask(result.rows[0]);
  },

  async delete(taskId: string): Promise<boolean> {
    const result = await pool.query(
      `
        DELETE FROM tasks
        WHERE id = $1
      `,
      [taskId]
    );

    return result.rowCount > 0;
  },
};
