'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function CareerSurveyAI() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('transcript'); // 'survey' or 'transcript'

  // Application Metrics & Status
  const [sessionStatus, setSessionStatus] = useState('IDLE'); // IDLE, RECORDING, TRANSCRIBING, EXTRACTING
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioCompression, setAudioCompression] = useState('Detecting...');
  const [transcriptLines, setTranscriptLines] = useState(0);
  const [aiStatus, setAiStatus] = useState('Ready');

  // Form Field States (Updated for Career, Experience & Skills Tracking)
  const [formData, setFormData] = useState({
    fullName: '',
    currentRole: '',
    yearsOfExperience: '',
    primarySkills: '',
    careerGoals: 'Awaiting interview parsing...'
  });

  // Transcription & Logs Output
  const [transcriptText, setTranscriptText] = useState('Awaiting microphone recording input...');
  const [engineLogs, setEngineLogs] = useState([
    '// Real-time professional parsing pipelines running.',
    '> Ollama data extraction engine idle.',
    '> Loaded model weights: Llama-3.2-3B',
    '> Structured profile mapping ready.'
  ]);

  // Recording References
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live Timer Count Control
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current !== null) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // --- Core Audio Capturing Engine (Adaptive Mobile-Safe Setup) ---
  const startVoiceCapture = async () => {
    try {
      setRecordingDuration(0);
      audioChunksRef.current = [];
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let chosenMimeType = '';
      let fileExt = 'webm';

      // Cross-browser mobile safe check overrides broken Ogg containers on phone browsers
      if (MediaRecorder.isTypeSupported('audio/webm; codecs=opus')) {
        chosenMimeType = 'audio/webm; codecs=opus';
        fileExt = 'webm';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        chosenMimeType = 'audio/webm';
        fileExt = 'webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        chosenMimeType = 'audio/mp4'; 
        fileExt = 'mp4';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        chosenMimeType = 'audio/wav';
        fileExt = 'wav';
      }

      setAudioCompression(chosenMimeType || 'Browser Native Default');

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
        
        const audioBlob = new Blob(audioChunksRef.current, { type: chosenMimeType || 'audio/webm' });
        await transmitAudioPayload(audioBlob, fileExt);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setSessionStatus('RECORDING');
    } catch (err) {
      console.error('Core audio system initialization failed:', err);
      alert('Microphone access denied. Check privacy permissions.');
    }
  };

  const stopVoiceCapture = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
  };

  // --- Network Backend Pipelines ---
  const transmitAudioPayload = async (audioBlob: Blob, fileExtension: string) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('audio', audioBlob, `career_interview.${fileExtension}`);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) throw new Error('Transcription network gateway failure.');

      const result = await response.json();
      const textOutput = result.text || 'Empty transcription returned from cluster.';

      setTranscriptText(textOutput);
      setTranscriptLines((prev) => prev + 1);
      
      await extractStructuredData(textOutput);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setTranscriptText(`Subsystem Error: ${errorMessage}`);
      setSessionStatus('IDLE');
      setAiStatus('Ready');
    }
  };

  const extractStructuredData = async (textToParse: string) => {
    setSessionStatus('EXTRACTING');
    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToParse }),
      });

      if (!response.ok) throw new Error('Extraction engine pipeline error.');

      const data = await response.json();
      
      // Map extracted variables cleanly to your brand-new professional schema
      setFormData({
        fullName: data.fullName || 'Not provided',
        currentRole: data.currentRole || 'Not provided',
        yearsOfExperience: data.yearsOfExperience || 'Not provided',
        primarySkills: data.primarySkills || 'Not provided',
        careerGoals: data.careerGoals || 'Uncertain'
      });

      setEngineLogs((prev) => [
        ...prev,
        `> Profile parsed successfully into system model database.`,
        `> Populated fields: Role="${data.currentRole || ''}", Experience="${data.yearsOfExperience || ''}"`
      ]);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setEngineLogs((prev) => [...prev, `> Error extracting career metadata: ${errorMessage}`]);
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
          📋 CAREER PROFILE
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

            <span className="text-slate-500">Audio Codec Stream</span>
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
            {isRecording ? '⏹️ Stop Voice Interview' : '🎙️ Start Voice Interview'}
          </button>
        </div>

        {/* View Switch Logic Area */}
        {activeTab === 'survey' ? (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-5">
            <h3 className="font-bold text-lg border-b border-slate-100 pb-2 text-slate-700">Professional Background</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Candidate / Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g., Jane Doe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Current Profession / Role</label>
                <input
                  type="text"
                  value={formData.currentRole}
                  onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                  placeholder="e.g., Software Engineer, Educator"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Years of Experience</label>
                <input
                  type="text"
                  value={formData.yearsOfExperience}
                  onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                  placeholder="e.g., 5 years, Entry level"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Core Professional Skills</label>
                <input
                  type="text"
                  value={formData.primarySkills}
                  onChange={(e) => setFormData({ ...formData, primarySkills: e.target.value })}
                  placeholder="e.g., React, Python, Network Management"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Career Goals & Aspirations</label>
                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-600 min-h-[60px]">
                  {formData.careerGoals}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-blue-500 tracking-wider uppercase">Live Interview Audio Output</h3>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm font-medium text-slate-700 leading-relaxed min-h-[80px]">
                "{transcriptText}"
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 shadow-xl border border-slate-800 space-y-2">
              <span className="text-xs font-mono text-slate-500 tracking-wider block uppercase">
                &gt;_ AI Profile Extraction Engine Logs
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