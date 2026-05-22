"use client";

import React, { useEffect, useRef } from "react";
import { useAppStore } from "@/store";
import { Terminal, AlignLeft } from "lucide-react";

export default function TranscriptPanel() {
  const { transcript, isRecording, isExtracting } = useAppStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Automatically anchors view frame down to display incoming lines cleanly
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  return (
    <div className="flex flex-col h-full overflow-hidden justify-between">
      {/* Scrollable Main Stream Window */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-4 text-slate-800">
          <AlignLeft size={16} className="text-slate-500" />
          <h2 className="text-base font-bold">Live Transcript</h2>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 font-sans text-sm">
          {transcript.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <p className="text-slate-400 text-xs font-medium">
                {isRecording ? "Listening closely... Speak into microphone." : "Awaiting transmission activation."}
              </p>
            </div>
          ) : (
            transcript.map((line, idx) => (
              <div key={idx} className="bg-white border border-slate-100 rounded-lg p-2.5 shadow-sm text-slate-700 animate-fadeIn">
                <span className="text-[10px] font-bold text-blue-500 block mb-0.5">INTERVIEWEE:</span>
                {line}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Structured Inference AI Logging Console */}
      <div className="mt-4 flex flex-col h-40 min-h-40 border-t border-slate-100 pt-4 bg-white">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
          <Terminal size={12} /> AI Extraction Engine Logs
        </div>
        <div className="flex-1 bg-slate-900 rounded-xl p-3 font-mono text-[11px] text-emerald-400 overflow-y-auto space-y-1 shadow-inner">
          <p className="text-slate-500">// Real-time structured pipelines running...</p>
          {isRecording && <p className="animate-pulse text-blue-400">&gt; Streaming Whisper speech tokens...</p>}
          {isExtracting ? (
            <p className="animate-pulse text-amber-400">&gt; Extracting structured field values with Llama 3...</p>
          ) : (
            <p className="text-slate-400">&gt; Llama 3 extraction engine idle.</p>
          )}
          <p className="text-slate-400">&gt; Loaded model weights: Llama-3-8B-Instruct</p>
          <p className="text-slate-400">&gt; JSON response schemas mapped dynamically.</p>
        </div>
      </div>
    </div>
  );
}
