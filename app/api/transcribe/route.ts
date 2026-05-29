import { NextResponse } from 'next/server';

// Hardcode the direct endpoint to your AWS Whisper server
const WHISPER_API_URL = 'http://51.21.197.50:8000/v1/audio/transcriptions';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('file');

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio data received' }, { status: 400 });
    }

    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile as Blob);
    whisperFormData.append('model', 'small');

    const response = await fetch(WHISPER_API_URL, {
      method: 'POST',
      body: whisperFormData,
    });

    if (!response.ok) {
      console.error('Whisper server communication failed', response.status, response.statusText);
      return NextResponse.json({ error: 'Whisper server communication failed' }, { status: 500 });
    }

    const data = await response.json();

    return NextResponse.json({ success: true, text: data.text ?? '' });
  } catch (error) {
    console.error('Transcription route error:', error);
    return NextResponse.json({ error: 'Failed to process audio data' }, { status: 500 });
  }
}
