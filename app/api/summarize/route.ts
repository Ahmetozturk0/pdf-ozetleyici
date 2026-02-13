import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pdf from 'pdf-parse';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const apiKey = formData.get('apiKey') as string || process.env.GEMINI_API_KEY;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required' }, { status: 401 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    let text = '';
    try {
      const data = await pdf(buffer);
      text = data.text;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
    }

    if (!text.trim()) {
      return NextResponse.json({ error: 'Could not extract text from PDF or PDF is empty' }, { status: 400 });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Summarize the following text clearly and concisely. Use bullet points for key takeaways if appropriate. Focus on the main ideas.

Text:
${text.slice(0, 30000)} // Limit context if necessary, though 1.5 Flash has a large window.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
