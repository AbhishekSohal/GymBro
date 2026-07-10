const db = require('../config/db');
const bcrypt = require('bcrypt');

class User {
    /**
     * Create a new user in the database with a hashed password
     * @param {string} email 
     * @param {string} password 
     * @param {string} name 
     * @returns {Object} The created user (excluding password_hash)
     */
    static async create(email, password, name) {
        // 1. Hash the password before saving to the database
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const queryText = `
      INSERT INTO users (email, password_hash, name)
      VALUES ($1, $2, $3)
      RETURNING id, email, name, created_at;
    `;
        const values = [email.toLowerCase().trim(), passwordHash, name];

        const { rows } = await db.query(queryText, values);
        return rows[0];
    }

    /**
     * Find a user by their email address
     * NOTE: This returns the password_hash so the controller can verify credentials.
     * @param {string} email 
     * @returns {Object|null} The user object or null if not found
     */
    static async findByEmail(email) {
        const queryText = `
      SELECT id, email, password_hash, name, created_at
      FROM users
      WHERE email = $1;
    `;
        const { rows } = await db.query(queryText, [email.toLowerCase().trim()]);

        if (rows.length === 0) return null;
        return rows[0];
    }

    /**
     * Find a user by their ID
     * NOTE: Excludes password_hash for security.
     * @param {number} id 
     * @returns {Object|null} The user object or null if not found
     */
    static async findById(id) {
        const queryText = `
      SELECT id, email, name, created_at
      FROM users
      WHERE id = $1;
    `;
        const { rows } = await db.query(queryText, [id]);

        if (rows.length === 0) return null;
        return rows[0];
    }
}

module.exports = User;