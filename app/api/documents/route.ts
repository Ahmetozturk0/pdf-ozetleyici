import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDocumentsByUserId, deleteDocument } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const userId = session.user.id;
        if (!userId) {
            return NextResponse.json({ error: 'User ID missing' }, { status: 401 });
        }

        const documents = await getDocumentsByUserId(userId);
        return NextResponse.json({ documents });
    } catch (error) {
        console.error('Error fetching documents:', error);
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
            return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
        }

        await deleteDocument(id, session.user.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting document:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
