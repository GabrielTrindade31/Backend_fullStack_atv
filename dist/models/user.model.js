"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = void 0;
const database_1 = require("../database");
const mapUser = (row) => ({
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    password: String(row.password),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
});
exports.userRepository = {
    async create(name, email, password) {
        const result = await database_1.pool.query(`
        INSERT INTO users (name, email, password)
        VALUES ($1, $2, $3)
        RETURNING id, name, email, password, created_at, updated_at
      `, [name, email, password]);
        return mapUser(result.rows[0]);
    },
    async findByEmail(email) {
        const result = await database_1.pool.query(`
        SELECT id, name, email, password, created_at, updated_at
        FROM users
        WHERE email = $1
        LIMIT 1
      `, [email]);
        if (result.rowCount === 0) {
            return null;
        }
        return mapUser(result.rows[0]);
    },
    async findById(id) {
        const result = await database_1.pool.query(`
        SELECT id, name, email, password, created_at, updated_at
        FROM users
        WHERE id = $1
        LIMIT 1
      `, [id]);
        if (result.rowCount === 0) {
            return null;
        }
        return mapUser(result.rows[0]);
    },
};
//# sourceMappingURL=user.model.js.map