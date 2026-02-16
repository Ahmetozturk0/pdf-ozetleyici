import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createNote, getNotesByNotebookId, updateNote, deleteNote } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const notebookId = searchParams.get('notebookId');
        if (!notebookId) {
            return NextResponse.json({ error: 'notebookId required' }, { status: 400 });
        }

        const notes = await getNotesByNotebookId(notebookId, session.user.id);
        return NextResponse.json({ notes });
    } catch (error) {
        console.error('Error fetching notes:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { notebookId, content } = await req.json();
        if (!notebookId || !content) {
            return NextResponse.json({ error: 'notebookId and content required' }, { status: 400 });
        }

        const note = await createNote({
            id: uuidv4(),
            notebook_id: notebookId,
            user_id: session.user.id,
            content,
        });

        return NextResponse.json({ note });
    } catch (error) {
        console.error('Error creating note:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id, content } = await req.json();
        if (!id || !content) {
            return NextResponse.json({ error: 'id and content required' }, { status: 400 });
        }

        await updateNote(id, session.user.id, content);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating note:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
        }

        await deleteNote(id, session.user.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting note:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
