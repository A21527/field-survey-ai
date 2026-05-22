"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store";
import { Mic, Square, Database } from "lucide-react";

export default function AudioPanel() {
  const { isRecording, setRecordingStatus, addTranscriptLine, extractFormValues, isExtracting } = useAppStore();
  const transcriptCount = useAppStore((state) => state.transcript.length);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAudioUpload = async (audioBlob: Blob) => {
    useAppStore.setState({ isExtracting: true });
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "survey_interview.webm");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.text) {
        const transcriptText = result.text.trim();
        if (transcriptText) {
          useAppStore.setState({ transcript: [] });
          const transcriptLines = transcriptText
            .split(/\r?\n|(?<=[.!?])\s+/)
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0);

          transcriptLines.forEach((line: string) => addTranscriptLine(line));
          await extractFormValues();
        }
      } else {
        console.error("Transcription returned invalid response", result);
      }
    } catch (error) {
      console.error("Network failure during audio upload:", error);
    } finally {
      useAppStore.setState({ isExtracting: false });
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const options = { mimeType: "audio/webm;codecs=opus" };
      const selectedOptions = MediaRecorder.isTypeSupported(options.mimeType)
        ? options
        : { mimeType: "audio/ogg;codecs=opus" };

      const mediaRecorder = new MediaRecorder(stream, selectedOptions);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await handleAudioUpload(audioBlob);
      };

      mediaRecorder.start(1000);
      setRecordingStatus(true);
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to gain microphone access:", err);
      alert("Could not start recording: Please allow microphone permissions.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setRecordingStatus(false);
  };

  return (
    <div className="flex flex-col h-full justify-between gap-6">
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-1">Field Controller</h2>
        <p className="text-xs text-slate-400 mb-6">Manage interview capture & data tracking</p>

        <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={isExtracting}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm transition-all shadow-md ${
            isExtracting
              ? "bg-slate-400 text-white cursor-not-allowed opacity-70"
              : isRecording
              ? "bg-rose-500 text-white hover:bg-rose-600 animate-pulse"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isExtracting ? (
            <>
              <span className="animate-spin">⏳</span> AI Extracting...
            </>
          ) : isRecording ? (
            <>
              <Square size={18} fill="white" /> Stop Interview
            </>
          ) : (
            <>
              <Mic size={18} /> Start Voice Capture
            </>
          )}
        </button>

        <div className="mt-6 border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Session Status</span>
            <span className={`font-bold uppercase tracking-wider text-[10px] ${isRecording ? "text-rose-500" : "text-slate-400"}`}>
              {isRecording ? "Streaming Audio" : "Idle"}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Recording Duration</span>
            <span className="font-mono font-bold text-slate-700">{formatTime(seconds)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Audio Compression</span>
            <span className="font-semibold text-slate-600">Ogg/Opus (Lightweight)</span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4 bg-white">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Database size={12} /> System Telemetry
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Transcript Lines</p>
            <p className="text-lg font-black text-slate-700">{transcriptCount}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">AI Status</p>
            <p className="text-xs font-bold text-emerald-600 mt-1">{isExtracting ? 'Processing' : 'Ready'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
