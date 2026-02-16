import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getChatMessagesByNotebookId, deleteChatMessagesByNotebookId } from '@/lib/db';

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
            return NextResponse.json({ error: 'notebookId gerekli.' }, { status: 400 });
        }

        const messages = await getChatMessagesByNotebookId(notebookId, session.user.id);
        return NextResponse.json({ messages });
    } catch (error) {
        console.error('Error fetching chat messages:', error);
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
        const notebookId = searchParams.get('notebookId');
        if (!notebookId) {
            return NextResponse.json({ error: 'notebookId gerekli.' }, { status: 400 });
        }

        await deleteChatMessagesByNotebookId(notebookId, session.user.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting chat messages:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
