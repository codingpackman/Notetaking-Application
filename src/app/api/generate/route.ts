import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { action, text, image } = await req.json();

    if (!text && !image) {
      return NextResponse.json({ error: 'Text or image is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is missing. Please set it in your .env.local file.' },
        { status: 500 }
      );
    }

    // Initialize the Gemini API client.
    const ai = new GoogleGenAI({ apiKey });

    let promptText = '';
    const textContext = text ? `\n\n"${text}"` : (image ? `\n\n(See attached image)` : '');

    switch (action) {
      case 'summary':
        promptText = `Explain the following content in your own words. Assume the reader is a beginner and might not know everything already. Make the summary more detailed than simply repeating what is written. Here is the content:${textContext}`;
        break;
      case 'question_hard':
        promptText = `Based on the following content, generate a hard practice question to test the reader's understanding. Provide the question and then the answer below it.${textContext}`;
        break;
      case 'question_review':
        promptText = `Based on the following content, generate a review practice question to test the reader's basic understanding. Provide the question and then the answer below it.${textContext}`;
        break;
      case 'question_tricky':
        promptText = `Based on the following content, generate a tricky practice question that might catch the reader off guard. Provide the question and then the answer below it.${textContext}`;
        break;
      case 'flashcards':
        promptText = `Create a few flashcards based on the following content. Format them clearly with 'Front: [Question/Concept]' and 'Back: [Answer/Explanation]'.${textContext}`;
        break;
      default:
        promptText = `Explain the following content:${textContext}`;
    }

    const contents: any[] = [promptText];

    if (image) {
      // The image comes as a data URL, e.g., "data:image/png;base64,iVBORw0KGgo..."
      const match = image.match(/^data:(image\/[a-zA-Z]*);base64,([^\"]*)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        contents.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      } else {
         console.warn("Could not parse image data URL.");
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
    });

    return NextResponse.json({ result: response.text });
  } catch (error: any) {
    console.error('Error generating AI content:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate content' }, { status: 500 });
  }
}
