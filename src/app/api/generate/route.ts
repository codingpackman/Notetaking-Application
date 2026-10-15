import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { action, text, image, images, userMessage, contextText, count } = await req.json();

    if (!text && !image && !(images && images.length > 0) && !userMessage && !contextText) {
      return NextResponse.json({ error: 'Text, image, or chat message is required' }, { status: 400 });
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

    const requestedCount = count ? Math.min(Math.max(1, parseInt(count, 10) || 1), 20) : null;

    const mathInstructions = `\n\nIMPORTANT: For any mathematical formulas or equations, you must use standard LaTeX delimiters. Use $ for inline math (e.g., $E=mc^2$) and $$ for block math (e.g., $$\\frac{1}{2}$$). Do not use parentheses like ($i$) or ($/frac{1}{60}$), strictly use $ or $$.`;

    switch (action) {
      case 'summary':
        promptText = `Explain the following content in your own words. Assume the reader is a beginner and might not know everything already. Make the summary more detailed than simply repeating what is written. Here is the content:${textContext}${mathInstructions}`;
        break;
      case 'question_hard':
        promptText = `Based on the following content, generate ${requestedCount ? `${requestedCount} hard practice questions` : 'a hard practice question'} to test the reader's understanding. Provide each question followed by its detailed answer below it.${textContext}${mathInstructions}`;
        break;
      case 'question_review':
        promptText = `Based on the following content, generate ${requestedCount ? `${requestedCount} review practice questions` : 'a review practice question'} to test the reader's basic understanding. Provide each question followed by its detailed answer below it.${textContext}${mathInstructions}`;
        break;
      case 'question_tricky':
        promptText = `Based on the following content, generate ${requestedCount ? `${requestedCount} tricky practice questions` : 'a tricky practice question'} that might catch the reader off guard. Provide each question followed by its detailed answer below it.${textContext}${mathInstructions}`;
        break;
      case 'flashcards':
        promptText = `Create ${requestedCount ? `${requestedCount} flashcards` : 'a few flashcards'} based on the following content. Format each flashcard clearly with 'Front: [Question/Concept]' and 'Back: [Answer/Explanation]'.${textContext}${mathInstructions}`;
        break;
      case 'chat':
        promptText = `You are a helpful AI study assistant. The user is asking a follow-up question regarding their recent study material or previous AI explanation.

Context from previous study material / response:
${contextText || text || 'None provided'}

User's follow-up question:
"${userMessage}"

Provide a clear, thorough, and beginner-friendly answer formatted nicely in markdown.${mathInstructions}`;
        break;
      default:
        promptText = `Explain the following content:${textContext}${mathInstructions}`;
    }

    const contents: any[] = [promptText];

    const imageArray = images || (image ? [image] : []);

    for (const img of imageArray) {
      if (img) {
        // The image comes as a data URL, e.g., "data:image/png;base64,iVBORw0KGgo..."
        const match = img.match(/^data:(image\/[a-zA-Z]*);base64,([^\"]*)$/);
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
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: contents,
    });

    return NextResponse.json({ result: response.text });
  } catch (error: any) {
    console.error('Error generating AI content:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate content' }, { status: 500 });
  }
}
