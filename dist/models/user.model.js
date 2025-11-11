"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = void 0;
const database_1 = require("../database");
const mapUser = (row) => ({
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    password: String(row.password),
    role: row.role,
    provider: row.provider,
    googleId: row.google_id ? String(row.google_id) : null,
    pictureUrl: row.picture_url ? String(row.picture_url) : null,
    birthDate: row.birth_date ? new Date(String(row.birth_date)) : null,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
});
exports.userRepository = {
    async create(input) {
        const { name, email, password, role = 'customer', provider = 'local', googleId = null, pictureUrl = null, birthDate = null, } = input;
        const normalizedEmail = email.toLowerCase();
        const result = await database_1.pool.query(`
        INSERT INTO users (name, email, password, role, provider, google_id, picture_url, birth_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name, email, password, role, provider, google_id, picture_url, birth_date, created_at, updated_at
      `, [name, normalizedEmail, password, role, provider, googleId, pictureUrl, birthDate]);
        return mapUser(result.rows[0]);
    },
    async linkGoogleAccount(userId, googleId, pictureUrl) {
        const result = await database_1.pool.query(`
        UPDATE users
        SET provider = 'google',
            google_id = $2,
            picture_url = COALESCE($3, picture_url),
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, email, password, role, provider, google_id, picture_url, birth_date, created_at, updated_at
      `, [userId, googleId, pictureUrl ?? null]);
        if (result.rowCount === 0) {
            return null;
        }
        return mapUser(result.rows[0]);
    },
    async findByEmail(email) {
        const normalizedEmail = email.toLowerCase();
        const result = await database_1.pool.query(`
        SELECT id, name, email, password, role, provider, google_id, picture_url, birth_date, created_at, updated_at
        FROM users
        WHERE email = $1
        LIMIT 1
      `, [normalizedEmail]);
        if (result.rowCount === 0) {
            return null;
        }
        return mapUser(result.rows[0]);
    },
    async findByGoogleId(googleId) {
        const result = await database_1.pool.query(`
        SELECT id, name, email, password, role, provider, google_id, picture_url, birth_date, created_at, updated_at
        FROM users
        WHERE google_id = $1
        LIMIT 1
      `, [googleId]);
        if (result.rowCount === 0) {
            return null;
        }
        return mapUser(result.rows[0]);
    },
    async findById(id) {
        const result = await database_1.pool.query(`
        SELECT id, name, email, password, role, provider, google_id, picture_url, birth_date, created_at, updated_at
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