import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export interface User {
    id: string;
    email: string;
    password: string;
    name?: string;
    created_at: string;
}

// Ensure users table exists
let tableCreated = false;
async function ensureTable() {
    if (tableCreated) return;
    await sql`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `;
    tableCreated = true;
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | undefined> {
    await ensureTable();
    const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
    return rows[0] as User | undefined;
}

// Create new user
export async function createUser(user: { id: string; email: string; password: string; name?: string }): Promise<User> {
    await ensureTable();

    // Check if exists
    const existing = await getUserByEmail(user.email);
    if (existing) {
        throw new Error('User already exists');
    }

    const rows = await sql`
        INSERT INTO users (id, email, password, name)
        VALUES (${user.id}, ${user.email}, ${user.password}, ${user.name || null})
        RETURNING *
    `;

    return rows[0] as User;
}

// Get all users
export async function getUsers(): Promise<User[]> {
    await ensureTable();
    const rows = await sql`SELECT * FROM users`;
    return rows as User[];
}
