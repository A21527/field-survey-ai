import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Parse the incoming text from your frontend voice recorder
    const { text } = await request.json();

    if (!text || text.trim() === "") {
      return NextResponse.json({
        fullName: 'Not provided',
        currentRole: 'Not provided',
        yearsOfExperience: 'Not provided',
        primarySkills: 'Not provided',
        careerGoals: 'No transcript data received.'
      });
    }

    // 2. Point to your AWS EC2 instance running your Ollama container
    // Use the central OLLAMA_URL env var for cleaner deployment config
    const OLLAMA_ENDPOINT = process.env.OLLAMA_URL || 'http://51.21.197.50:11434/api/generate';

    // 3. Construct a precise system prompt mapping out the new Career Profile schema
    const systemPrompt = `
      You are an expert recruitment assistant. Your job is to extract professional information from the text transcript of a career interview.
      
      You must extract values for these exact keys:
      - "fullName": The candidate's name.
      - "currentRole": Their current job title, profession, or current field of study.
      - "yearsOfExperience": How long they have worked in their industry or role.
      - "primarySkills": A comma-separated list of technical tools, programming languages, or core professional skills mentioned.
      - "careerGoals": A short 1-sentence summary of their future aspirations or what they want to achieve.

      Strict rules:
      - Fill missing keys with "Not provided".
      - Return ONLY a valid, raw JSON object. 
      - Do not wrap the JSON object in markdown blocks like \`\`\`json. 
      - Do not include any introductory text, pleasantries, or explanations.
    `;

    // 4. Dispatch payload to Ollama utilizing strict native JSON parsing format
    const ollamaResponse = await fetch(OLLAMA_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:3b', // Matches your current optimized CPU weights
        prompt: `Interview Transcript:\n"${text}"`,
        system: systemPrompt,
        stream: false,
        format: 'json' // This tells Ollama to strictly lock the model inside an output schema
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama instance connection error: ${ollamaResponse.statusText}`);
    }

    const ollamaData = await ollamaResponse.json();
    
    // 5. Clean and unpack the raw response string into structured JSON
    const cleanJsonOutput = JSON.parse(ollamaData.response.trim());

    // 6. Safely return the structured object right back to your frontend states
    return NextResponse.json({
      fullName: cleanJsonOutput.fullName || 'Not provided',
      currentRole: cleanJsonOutput.currentRole || 'Not provided',
      yearsOfExperience: cleanJsonOutput.yearsOfExperience || 'Not provided',
      primarySkills: cleanJsonOutput.primarySkills || 'Not provided',
      careerGoals: cleanJsonOutput.careerGoals || 'Uncertain'
    });

  } catch (error: unknown) {
    console.error('Critical failure in extraction pipeline:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Fallback object keeps your application UI from crashing if a connection times out
    return NextResponse.json({
      fullName: 'System Error',
      currentRole: 'Pipeline failed',
      yearsOfExperience: 'None',
      primarySkills: 'None',
      careerGoals: `Error log context: ${errorMessage}`
    }, { status: 500 });
  }
}