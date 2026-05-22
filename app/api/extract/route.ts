import { NextResponse } from 'next/server';

// This points to where Ollama will be running (your EC2 instance or local machine)
const OLLAMA_API_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat';

export async function POST(request: Request) {
  try {
    const { transcript, schema } = await request.json();

    // 1. Tell Llama 3 exactly how to behave
    const systemPrompt = `You are a precise data extraction engine. Your sole task is to extract field values from an interview transcript based on a provided schema definition.
    Rules:
    1. Output MUST be a single JSON object where the keys exactly match the "id" fields provided in the schema.
    2. If a field is missing from the transcript, set its value to null. Do not invent data.
    3. Output ONLY raw valid JSON. No conversational text, no markdown backticks.`;

    // 2. Give Llama 3 your current custom form layout and the text it needs to read
    const userPrompt = `
Schema Layout:
${JSON.stringify(schema, null, 2)}

Interview Transcript:
"${transcript}"
    `;

    // 3. Send it off to Ollama
    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3', 
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false,
        format: 'json' // This forces Llama 3 to output clean data without text fluff
      })
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Ollama communication failed' }, { status: 500 });
    }

    const data = await response.json();
    const rawContent = data.message?.content;
    
    // Parse the text back into a real object to send to your frontend panels
    const extractedData = JSON.parse(rawContent);

    return NextResponse.json({ success: true, data: extractedData });

  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: 'Failed to process transcript' }, { status: 500 });
  }
}