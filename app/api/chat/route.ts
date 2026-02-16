import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@/auth';
import { getDocumentById, getDocumentsByNotebookId, saveChatMessage } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 });
        }

        const { docId, docIds, notebookId, message } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Mesaj gerekli.' }, { status: 400 });
        }

        // Gather context from selected docs, single doc, or entire notebook
        let contextParts: string[] = [];
        let contextTitle = '';

        if (docIds && Array.isArray(docIds) && docIds.length > 0) {
            // Specific selected documents
            for (const id of docIds) {
                const full = await getDocumentById(id, session.user.id);
                if (full?.content) {
                    contextParts.push(`--- ${full.title} ---\n${full.content.slice(0, 50000)}`);
                }
            }
            if (contextParts.length === 0) {
                return NextResponse.json({
                    error: 'Seçilen kaynaklarda içerik bulunamadı.'
                }, { status: 400 });
            }
            contextTitle = `Seçili Kaynaklar (${contextParts.length} belge)`;
        } else if (notebookId) {
            // All documents in the notebook
            const docs = await getDocumentsByNotebookId(notebookId, session.user.id);
            for (const d of docs) {
                const full = await getDocumentById(d.id, session.user.id);
                if (full?.content) {
                    contextParts.push(`--- ${full.title} ---\n${full.content.slice(0, 50000)}`);
                }
            }
            if (contextParts.length === 0) {
                return NextResponse.json({
                    error: 'Bu not defterinde içeriği olan kaynak bulunamadı.'
                }, { status: 400 });
            }
            contextTitle = `Not Defteri (${contextParts.length} kaynak)`;
        } else if (docId) {
            // Single document
            const doc = await getDocumentById(docId, session.user.id);
            if (!doc) {
                return NextResponse.json({ error: 'Belge bulunamadı.' }, { status: 404 });
            }
            if (!doc.content) {
                return NextResponse.json({
                    error: 'Bu belgenin içeriği kaydedilmemiş. Lütfen tekrar yükleyin.'
                }, { status: 400 });
            }
            contextParts.push(`--- ${doc.title} ---\n${doc.content.slice(0, 100000)}`);
            contextTitle = doc.title;
        } else {
            return NextResponse.json({ error: 'docId, docIds veya notebookId gerekli.' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API Anahtarı eksik.' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

        const prompt = `
Sen yardımcı bir asistansın. Aşağıdaki belge(ler)in içeriğine dayanarak kullanıcının sorusunu cevapla.
Cevabın Türkçe, net ve anlaşılır olsun. Belgeler dışındaki konularda bilgi uydurma.

Bağlam: ${contextTitle}

--- BELGELER BAŞLANGICI ---
${contextParts.join('\n\n')}
--- BELGELER SONU ---

Soru: ${message}
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Save chat messages to DB if we have a notebookId
        if (notebookId) {
            try {
                await saveChatMessage({ id: uuidv4(), notebook_id: notebookId, user_id: session.user.id, role: 'user', content: message });
                await saveChatMessage({ id: uuidv4(), notebook_id: notebookId, user_id: session.user.id, role: 'assistant', content: text });
            } catch (e) {
                console.warn('Could not save chat messages:', e);
            }
        }

        return NextResponse.json({ reply: text });

    } catch (error: any) {
        console.error('Chat error:', error);
        return NextResponse.json({ error: 'Bir hata oluştu.' }, { status: 500 });
    }
}
