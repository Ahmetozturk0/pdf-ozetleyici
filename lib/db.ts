import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// --- INTERFACES ---

export interface User {
    id: string;
    email: string;
    password: string;
    name?: string;
    created_at: string;
}

export interface Notebook {
    id: string;
    user_id: string;
    title: string;
    emoji: string;
    created_at: string;
    updated_at: string;
}

export interface Document {
    id: string;
    user_id: string;
    notebook_id?: string;
    title: string;
    summary: string;
    content?: string;
    file_hash: string;
    created_at: string;
    updated_at: string;
}

export interface ChatMessage {
    id: string;
    notebook_id: string;
    user_id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export interface Note {
    id: string;
    notebook_id: string;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string;
}

// --- SCHEMA ---

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

    await sql`
        CREATE TABLE IF NOT EXISTS notebooks (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            emoji TEXT DEFAULT '📓',
            created_at TIMESTAMP DEFAULT NOW()
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            notebook_id TEXT,
            title TEXT NOT NULL,
            summary TEXT NOT NULL,
            content TEXT,
            file_hash TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            notebook_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `;

    // Chat messages table
    await sql`
        CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            notebook_id TEXT NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `;

    // Migrations for existing tables
    await sql`ALTER TABLE documents ADD COLUMN IF NOT EXISTS content TEXT`;
    await sql`ALTER TABLE documents ADD COLUMN IF NOT EXISTS notebook_id TEXT`;
    await sql`ALTER TABLE notebooks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`;
    await sql`ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`;

    // Indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_notebooks_user_id ON notebooks(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_documents_notebook_id ON documents(notebook_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_documents_file_hash ON documents(user_id, file_hash)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notes_notebook_id ON notes(notebook_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_notebook_id ON chat_messages(notebook_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;

    tableCreated = true;
}

// --- NOTEBOOKS ---

export async function createNotebook(notebook: { id: string; user_id: string; title: string; emoji?: string }): Promise<Notebook> {
    await ensureTable();
    const rows = await sql`
        INSERT INTO notebooks (id, user_id, title, emoji)
        VALUES (${notebook.id}, ${notebook.user_id}, ${notebook.title}, ${notebook.emoji || '📓'})
        RETURNING *
    `;
    return rows[0] as Notebook;
}

export async function getNotebooksByUserId(userId: string): Promise<Notebook[]> {
    await ensureTable();
    const rows = await sql`
        SELECT * FROM notebooks WHERE user_id = ${userId} ORDER BY created_at DESC
    `;
    return rows as Notebook[];
}

export async function getNotebookById(id: string, userId: string): Promise<Notebook | undefined> {
    await ensureTable();
    const rows = await sql`
        SELECT * FROM notebooks WHERE id = ${id} AND user_id = ${userId}
    `;
    return rows[0] as Notebook | undefined;
}

export async function updateNotebook(id: string, userId: string, data: { title?: string; emoji?: string }) {
    await ensureTable();
    if (data.title && data.emoji) {
        await sql`UPDATE notebooks SET title = ${data.title}, emoji = ${data.emoji} WHERE id = ${id} AND user_id = ${userId}`;
    } else if (data.title) {
        await sql`UPDATE notebooks SET title = ${data.title} WHERE id = ${id} AND user_id = ${userId}`;
    } else if (data.emoji) {
        await sql`UPDATE notebooks SET emoji = ${data.emoji} WHERE id = ${id} AND user_id = ${userId}`;
    }
}

export async function deleteNotebook(id: string, userId: string) {
    await ensureTable();
    // Delete all related data first
    await sql`DELETE FROM chat_messages WHERE notebook_id = ${id} AND user_id = ${userId}`;
    await sql`DELETE FROM notes WHERE notebook_id = ${id} AND user_id = ${userId}`;
    await sql`DELETE FROM documents WHERE notebook_id = ${id} AND user_id = ${userId}`;
    await sql`DELETE FROM notebooks WHERE id = ${id} AND user_id = ${userId}`;
}

// --- DOCUMENTS ---

export async function createDocument(doc: {
    id: string; user_id: string; notebook_id?: string;
    title: string; summary: string; content?: string; file_hash: string;
}) {
    await ensureTable();
    await sql`
        INSERT INTO documents (id, user_id, notebook_id, title, summary, content, file_hash)
        VALUES (${doc.id}, ${doc.user_id}, ${doc.notebook_id || null}, ${doc.title}, ${doc.summary}, ${doc.content || null}, ${doc.file_hash})
    `;
}

export async function getDocumentsByUserId(userId: string): Promise<Document[]> {
    await ensureTable();
    const rows = await sql`
        SELECT id, user_id, notebook_id, title, summary, file_hash, created_at
        FROM documents WHERE user_id = ${userId} ORDER BY created_at DESC
    `;
    return rows as Document[];
}

export async function getDocumentsByNotebookId(notebookId: string, userId: string): Promise<Document[]> {
    await ensureTable();
    const rows = await sql`
        SELECT id, user_id, notebook_id, title, summary, file_hash, created_at
        FROM documents WHERE notebook_id = ${notebookId} AND user_id = ${userId} ORDER BY created_at DESC
    `;
    return rows as Document[];
}

export async function getDocumentByHash(userId: string, fileHash: string): Promise<Document | undefined> {
    await ensureTable();
    const rows = await sql`
        SELECT * FROM documents WHERE user_id = ${userId} AND file_hash = ${fileHash} LIMIT 1
    `;
    return rows[0] as Document | undefined;
}

export async function getDocumentById(id: string, userId: string): Promise<Document | undefined> {
    await ensureTable();
    const rows = await sql`
        SELECT * FROM documents WHERE id = ${id} AND user_id = ${userId}
    `;
    return rows[0] as Document | undefined;
}

export async function deleteDocument(id: string, userId: string) {
    await ensureTable();
    await sql`DELETE FROM documents WHERE id = ${id} AND user_id = ${userId}`;
}

// --- NOTES ---

export async function createNote(note: { id: string; notebook_id: string; user_id: string; content: string }): Promise<Note> {
    await ensureTable();
    const rows = await sql`
        INSERT INTO notes (id, notebook_id, user_id, content)
        VALUES (${note.id}, ${note.notebook_id}, ${note.user_id}, ${note.content})
        RETURNING *
    `;
    return rows[0] as Note;
}

export async function getNotesByNotebookId(notebookId: string, userId: string): Promise<Note[]> {
    await ensureTable();
    const rows = await sql`
        SELECT * FROM notes WHERE notebook_id = ${notebookId} AND user_id = ${userId} ORDER BY updated_at DESC
    `;
    return rows as Note[];
}

export async function updateNote(id: string, userId: string, content: string) {
    await ensureTable();
    await sql`
        UPDATE notes SET content = ${content}, updated_at = NOW()
        WHERE id = ${id} AND user_id = ${userId}
    `;
}

export async function deleteNote(id: string, userId: string) {
    await ensureTable();
    await sql`DELETE FROM notes WHERE id = ${id} AND user_id = ${userId}`;
}

// --- USERS ---

export async function getUserByEmail(email: string): Promise<User | undefined> {
    await ensureTable();
    const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
    return rows[0] as User | undefined;
}

export async function createUser(user: { id: string; email: string; password: string; name?: string }): Promise<User> {
    await ensureTable();
    const existing = await getUserByEmail(user.email);
    if (existing) throw new Error('User already exists');

    const rows = await sql`
        INSERT INTO users (id, email, password, name)
        VALUES (${user.id}, ${user.email}, ${user.password}, ${user.name || null})
        RETURNING *
    `;
    return rows[0] as User;
}

// --- CHAT MESSAGES ---

export async function saveChatMessage(msg: { id: string; notebook_id: string; user_id: string; role: 'user' | 'assistant'; content: string }): Promise<ChatMessage> {
    await ensureTable();
    const rows = await sql`
        INSERT INTO chat_messages (id, notebook_id, user_id, role, content)
        VALUES (${msg.id}, ${msg.notebook_id}, ${msg.user_id}, ${msg.role}, ${msg.content})
        RETURNING *
    `;
    return rows[0] as ChatMessage;
}

export async function getChatMessagesByNotebookId(notebookId: string, userId: string): Promise<ChatMessage[]> {
    await ensureTable();
    const rows = await sql`
        SELECT * FROM chat_messages
        WHERE notebook_id = ${notebookId} AND user_id = ${userId}
        ORDER BY created_at ASC
    `;
    return rows as ChatMessage[];
}

export async function deleteChatMessagesByNotebookId(notebookId: string, userId: string) {
    await ensureTable();
    await sql`DELETE FROM chat_messages WHERE notebook_id = ${notebookId} AND user_id = ${userId}`;
}
