import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createNotebook, getNotebooksByUserId, deleteNotebook, updateNotebook } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const notebooks = await getNotebooksByUserId(session.user.id);
        return NextResponse.json({ notebooks });
    } catch (error) {
        console.error('Error fetching notebooks:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { title, emoji } = await req.json();
        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const notebook = await createNotebook({
            id: uuidv4(),
            user_id: session.user.id,
            title,
            emoji: emoji || '📓',
        });

        return NextResponse.json({ notebook });
    } catch (error) {
        console.error('Error creating notebook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id, title, emoji } = await req.json();
        if (!id) {
            return NextResponse.json({ error: 'Notebook ID required' }, { status: 400 });
        }

        await updateNotebook(id, session.user.id, { title, emoji });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating notebook:', error);
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
            return NextResponse.json({ error: 'Notebook ID required' }, { status: 400 });
        }

        await deleteNotebook(id, session.user.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting notebook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
