import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import { auth } from '@/auth';
import { createDocument, getDocumentByHash } from '@/lib/db';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let tempFilePath: string | null = null;
  let fileManager: any = null;
  let uploadResult: any = null;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const apiKey = formData.get('apiKey') as string || process.env.GEMINI_API_KEY;
    const notebookId = formData.get('notebookId') as string || undefined;

    if (!file) {
      return NextResponse.json({ error: 'Dosya yüklenmedi.' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API Anahtarı bulunamadı.' }, { status: 401 });
    }

    // 1. Save file to temporary disk location
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Calculate MD5 hash to check for duplicates
    const fileHash = crypto.createHash('md5').update(buffer).digest('hex');

    // Check DB for existing summary
    const existingDoc = await getDocumentByHash(session.user.id, fileHash);
    if (existingDoc) {
      console.log('Returning existing summary from DB');
      return NextResponse.json({
        summary: existingDoc.summary,
        id: existingDoc.id,
        fromCache: true
      });
    }

    // Create a unique temp file path
    const tempDir = os.tmpdir();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize filename
    tempFilePath = path.join(tempDir, `upload-${uniqueSuffix}-${originalName}`);

    await writeFile(tempFilePath, buffer);
    console.log(`File saved locally to: ${tempFilePath}`);

    // 2. Upload file to Gemini
    // We use GoogleAIFileManager to handle file uploads
    fileManager = new GoogleAIFileManager(apiKey);

    uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: file.type || 'application/pdf',
      displayName: originalName,
    });

    console.log(`Uploaded file to Gemini: ${uploadResult.file.uri} (${uploadResult.file.state})`);

    // 3. Generate Content using File URI
    // Use 'gemini-2.5-flash'
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    const prompt = `Bu PDF belgesini Türkçe olarak, net ve anlaşılır bir şekilde özetle. Önemli noktaları madde işaretleri ile belirt. Belgenin ana fikrine ve detaylarına odaklan.`;

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri
        }
      },
      { text: prompt }
    ]);

    const response = await result.response;
    const summary = response.text();

    // Auto-create notebook if needed
    let finalNotebookId = notebookId;
    let createdNotebook = null;

    if (!finalNotebookId) {
      // Ask Gemini to generate a short title for the notebook
      let autoTitle = file.name.replace('.pdf', '');
      try {
        const titleResult = await model.generateContent([
          {
            fileData: {
              mimeType: uploadResult.file.mimeType,
              fileUri: uploadResult.file.uri
            }
          },
          { text: 'Bu PDF belgesi için kısa (en fazla 5 kelime), açıklayıcı bir Türkçe başlık üret. Sadece başlığı döndür, başka hiçbir şey yazma. Tırnak işareti kullanma.' }
        ]);
        const titleResponse = await titleResult.response;
        const generatedTitle = titleResponse.text().trim();
        if (generatedTitle && generatedTitle.length < 60) {
          autoTitle = generatedTitle;
        }
      } catch (e) {
        console.warn('Could not generate auto title:', e);
      }

      const { createNotebook } = await import('@/lib/db');
      createdNotebook = await createNotebook({
        id: uuidv4(),
        user_id: session.user.id,
        title: autoTitle,
        emoji: '📓',
      });
      finalNotebookId = createdNotebook.id;
    }

    // Extract full text from PDF via Gemini
    let pdfText = '';
    try {
      const extractResult = await model.generateContent([
        {
          fileData: {
            mimeType: uploadResult.file.mimeType,
            fileUri: uploadResult.file.uri
          }
        },
        { text: 'Bu PDF belgesindeki TÜM metni olduğu gibi, hiçbir şey eklemeden veya çıkarmadan aynen çıkar. Sadece belgedeki ham metni döndür, yorum veya açıklama ekleme.' }
      ]);
      const extractResponse = await extractResult.response;
      pdfText = extractResponse.text();
      console.log('PDF text extracted via Gemini, length:', pdfText.length);
    } catch (e) {
      console.error('Failed to extract text via Gemini:', e);
    }

    // Save to Database
    const docId = uuidv4();
    await createDocument({
      id: docId,
      user_id: session.user.id,
      notebook_id: finalNotebookId,
      title: file.name,
      summary: summary,
      content: pdfText,
      file_hash: fileHash
    });

    // 4. Cleanup (Delete local temp file)
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      await unlink(tempFilePath);
    }

    // Delete remote file to keep storage clean
    try {
      if (uploadResult && uploadResult.file && uploadResult.file.name) {
        await fileManager.deleteFile(uploadResult.file.name);
        console.log(`Deleted remote file: ${uploadResult.file.name}`);
      }
    } catch (cleanupErr) {
      console.warn("Could not delete remote file:", cleanupErr);
    }

    return NextResponse.json({
      summary,
      id: docId,
      notebook: createdNotebook || undefined
    });

  } catch (error: any) {
    console.error('İşlem Hatası:', error);

    // Attempt cleanup on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { await unlink(tempFilePath); } catch (e) { }
    }

    if (error.message?.includes('404')) {
      return NextResponse.json({ error: 'Model bulunamadı veya API hatası (404).' }, { status: 404 });
    }

    return NextResponse.json({ error: `Sunucu hatası: ${error.message || 'Bilinmeyen hata'}` }, { status: 500 });
  }
}
