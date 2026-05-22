"use client";

import { useState } from "react";
import AudioPanel from "../components/AudioPanel";
import SurveyForm from "../components/SurveyForm";
import TranscriptPanel from "../components/TranscriptPanel";


export default function Home() {
  const [activeTab, setActiveTab] = useState<"form" | "transcript">("form");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Application Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-800">FieldAgent AI</h1>
        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-xs font-semibold text-emerald-700">Server Connected</span>
        </div>
      </header>

      {/* Mobile Smartphone Tab Selector (Hidden on Tablets and Laptops) */}
      <div className="md:hidden flex border-b border-slate-200 bg-white sticky top-0 z-10">
        <button
          onClick={() => setActiveTab("form")}
          className={`flex-1 py-3.5 text-center font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === "form" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"
          }`}
        >
          📋 Survey View
        </button>
        <button
          onClick={() => setActiveTab("transcript")}
          className={`flex-1 py-3.5 text-center font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === "transcript" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"
          }`}
        >
          💬 Live Transcript
        </button>
      </div>

      {/* Main Multi-Column Panel Engine */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4 md:p-6 h-[calc(100vh-73px)] overflow-hidden">
        
        {/* Left Column: Audio controls (Always visible) */}
        <section className="col-span-1 bg-white rounded-2xl border border-slate-200 p-4 flex flex-col shadow-sm h-fit md:h-full overflow-y-auto">
          <AudioPanel />
        </section>

        {/* Center Column: Interactive Dynamic Survey Form */}
        <section className={`col-span-1 md:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-y-auto ${
          activeTab === "form" ? "block" : "hidden md:block"
        }`}>
          <SurveyForm />
        </section>

        {/* Right Column: AI Logs & Text Transcription Streams */}
        <section className={`col-span-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col overflow-hidden ${
          activeTab === "transcript" ? "block" : "hidden lg:flex"
        }`}>
          <TranscriptPanel />
        </section>

      </div>
    </main>
  );
}
