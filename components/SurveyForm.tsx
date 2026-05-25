'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function FieldSurveyAI() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('transcript'); // 'survey' or 'transcript'

  // Application Metrics & Status
  const [sessionStatus, setSessionStatus] = useState('IDLE'); // IDLE, RECORDING, TRANSCRIBING, EXTRACTING
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioCompression, setAudioCompression] = useState('Detecting...');
  const [transcriptLines, setTranscriptLines] = useState(0);
  const [aiStatus, setAiStatus] = useState('Ready');

  // Form Field States
  const [formData, setFormData] = useState({
    respondentName: '',
    age: '',
    satisfactionLevel: 'Awaiting evaluation...'
  });

  // Transcription & Logs Output
  const [transcriptText, setTranscriptText] = useState('Awaiting microphone recording input...');
  const [engineLogs, setEngineLogs] = useState([
    '// Real-time structured pipelines running.',
    '> Llama 3 extraction engine idle.',
    '> Loaded model weights: Llama-3-8B-Instruct',
    '> JSON response schemas mapped'
  ]);

  // Recording References
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Live Timer Count Control
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  // Formats seconds into a standard 00:00 string
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // --- Core Audio Capturing Engine ---
  const startVoiceCapture = async () => {
    try {
      // 1. Reset metrics
      setRecordingDuration(0);
      audioChunksRef.current = [];
      
      // 2. Request explicit media access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 3. Adaptive Codec Extraction Strategy (Forces off broken Ogg/Opus streams on mobile devices)
      let chosenMimeType = '';
      let fileExt = 'webm';

      if (MediaRecorder.isTypeSupported('audio/webm; codecs=opus')) {
        chosenMimeType = 'audio/webm; codecs=opus';
        fileExt = 'webm';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        chosenMimeType = 'audio/webm';
        fileExt = 'webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        chosenMimeType = 'audio/mp4'; // Native hardware standard fallback for Apple Safari/iOS
        fileExt = 'mp4';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        chosenMimeType = 'audio/wav';
        fileExt = 'wav';
      }

      // Display the actual operating system codec directly onto the Telemetry window
      setAudioCompression(chosenMimeType || 'Browser Native Default');

      // 4. Initialize Core Engine Components
      const options = chosenMimeType ? { mimeType: chosenMimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setSessionStatus('TRANSCRIBING');
        setAiStatus('Processing...');
        
        // Assemble Binary Blob utilizing the explicitly verified clean mimeType container
        const audioBlob = new Blob(audioChunksRef.current, { type: chosenMimeType || 'audio/webm' });
        
        await transmitAudioPayload(audioBlob, fileExt);
      };

      // Fire Up Audio Processing Context Hardware
      mediaRecorder.start();
      setIsRecording(true);
      setSessionStatus('RECORDING');
    } catch (err) {
      console.error('Core audio subsystem initialization failed:', err);
      alert('Microphone access denied or hardware busy. Verify profile permissions.');
    }
  };

  const stopVoiceCapture = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop()); // Instantly release microphone hardware
    }
    setIsRecording(false);
  };

  // --- Network Backend Pipelines ---
  const transmitAudioPayload = async (audioBlob, fileExtension) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, `survey_recording.${fileExtension}`);

      // Calls your Vercel local Next.js safe proxy router API
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Transcription network gateway failure.');

      const result = await response.json();
      const textOutput = result.text || 'Empty transcription returned from cluster.';

      setTranscriptText(textOutput);
      setTranscriptLines((prev) => prev + 1);
      
      // Chain instantly to extraction step
      await extractStructuredData(textOutput);
    } catch (err) {
      setTranscriptText(`Subsystem Error: ${err.message}`);
      setSessionStatus('IDLE');
      setAiStatus('Ready');
    }
  };

  const extractStructuredData = async (textToParse) => {
    setSessionStatus('EXTRACTING');
    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToParse }),
      });

      if (!response.ok) throw new Error('Extraction engine pipeline error.');

      const data = await response.json();
      
      // Update targeted form text fields
      setFormData({
        respondentName: data.name || 'Not provided',
        age: data.age || 'Not provided',
        satisfactionLevel: data.satisfaction || 'Uncertain'
      });

      setEngineLogs((prev) => [
        ...prev,
        `> Structured data extraction completed successfully.`,
        `> Populated fields: Name="${data.name || ''}", Age="${data.age || ''}"`
      ]);

    } catch (err) {
      setEngineLogs((prev) => [...prev, `> Error extracting structures: ${err.message}`]);
    } finally {
      setSessionStatus('IDLE');
      setAiStatus('Ready');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* Upper Navigation Tab Block */}
      <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => setActiveTab('survey')}
          className={`flex-1 py-4 text-center font-semibold text-sm transition-all ${
            activeTab === 'survey' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/20' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          📋 SURVEY VIEW
        </button>
        <button
          onClick={() => setActiveTab('transcript')}
          className={`flex-1 py-4 text-center font-semibold text-sm transition-all ${
            activeTab === 'transcript' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/20' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          💬 LIVE TRANSCRIPT
        </button>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* Hardware & Metric Telemetry Card Component */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <span className="text-slate-500">Session Status</span>
            <span className={`text-right font-bold ${sessionStatus !== 'IDLE' ? 'text-amber-500 animate-pulse' : 'text-slate-600'}`}>
              {sessionStatus}
            </span>

            <span className="text-slate-500">Recording Duration</span>
            <span className="text-right font-mono font-bold text-slate-700">{formatTime(recordingDuration)}</span>

            <span className="text-slate-500">Audio Compression</span>
            <span className="text-right font-medium text-blue-600 truncate max-w-[180px] block ml-auto">
              {audioCompression}
            </span>
          </div>

          <hr className="border-slate-100" />

          <div>
            <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3">📁 System Telemetry</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <span className="block text-xs text-slate-400 font-medium uppercase">Transcript Lines</span>
                <span className="text-xl font-bold text-slate-700">{transcriptLines}</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <span className="block text-xs text-slate-400 font-medium uppercase">AI Status</span>
                <span className={`text-base font-bold ${aiStatus === 'Ready' ? 'text-green-600' : 'text-amber-500 animate-pulse'}`}>
                  {aiStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Large Action Recording Controller */}
          <button
            onClick={isRecording ? stopVoiceCapture : startVoiceCapture}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-md transition-all active:scale-[0.98] ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-200' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
            }`}
          >
            {isRecording ? '⏹️ Stop Voice Capture' : '🎙️ Start Voice Capture'}
          </button>
        </div>

        {/* View Switch Logic Area */}
        {activeTab === 'survey' ? (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-5">
            <h3 className="font-bold text-lg border-b border-slate-100 pb-2 text-slate-700">Survey Form Fields</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Respondent Name</label>
                <input
                  type="text"
                  value={formData.respondentName}
                  onChange={(e) => setFormData({ ...formData, respondentName: e.target.value })}
                  placeholder="Awaiting extraction pipeline..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Age</label>
                <input
                  type="text"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="Awaiting extraction pipeline..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Satisfaction Level</label>
                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-600">
                  {formData.satisfactionLevel}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Live Text Output Display Box */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-blue-500 tracking-wider uppercase">Interviewee Output</h3>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm font-medium text-slate-700 leading-relaxed min-h-[80px]">
                "{transcriptText}"
              </div>
            </div>

            {/* Neural Network Engine Log Console View */}
            <div className="bg-slate-900 rounded-2xl p-4 shadow-xl border border-slate-800 space-y-2">
              <span className="text-xs font-mono text-slate-500 tracking-wider block uppercase">
                &gt;_ AI Extraction Engine Logs
              </span>
              <div className="font-mono text-xs text-green-400 space-y-1 overflow-x-auto max-h-[160px] leading-relaxed p-1">
                {engineLogs.map((log, index) => (
                  <div key={index} className="whitespace-pre-wrap">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}