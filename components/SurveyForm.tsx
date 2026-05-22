"use client";

import React from "react";
import { useAppStore } from "@/store";
import { Trash2, Plus, Printer } from "lucide-react";

export default function SurveyForm() {
  const { fields, addField, removeField, updateFieldValue, updateFieldLabel } = useAppStore();

  return (
    <div className="flex flex-col h-full justify-between min-h-[400px]">
      <div>
        {/* Top Operational Commands Bar */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-800">Survey Fields</h2>
            <p className="text-xs text-slate-400">Supervise AI entry changes in real time</p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
          >
            <Printer size={14} /> Export Print
          </button>
        </div>

        {/* Generated Inputs Element Canvas */}
        <div className="space-y-4">
          {fields.map((field) => (
            <div
              key={field.id}
              className="relative border border-slate-200 p-4 rounded-xl bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between gap-4 mb-2">
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => updateFieldLabel(field.id, e.target.value)}
                  className="font-bold text-xs uppercase tracking-wider text-slate-600 bg-transparent focus:bg-slate-100 rounded px-1 py-0.5 outline-none w-full transition"
                />
                <button
                  onClick={() => removeField(field.id)}
                  className="text-slate-400 hover:text-rose-500 transition p-1 rounded hover:bg-rose-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {field.type === "text" && (
                <input
                  type="text"
                  placeholder="Awaiting conversation context..."
                  value={field.value}
                  onChange={(e) => updateFieldValue(field.id, e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
                />
              )}

              {field.type === "number" && (
                <input
                  type="number"
                  placeholder="0"
                  value={field.value}
                  onChange={(e) => updateFieldValue(field.id, e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
                />
              )}

              {field.type === "select" && (
                <select
                  value={field.value}
                  onChange={(e) => updateFieldValue(field.id, e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
                >
                  <option value="">Awaiting evaluation selection...</option>
                  {field.options?.map((opt, idx) => (
                    <option key={idx} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Persistent Injector Control Unit */}
      <div className="border-t border-slate-100 pt-4 mt-6 bg-white sticky bottom-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Insert Schema Field</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => addField("text")}
            className="flex items-center justify-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 py-2 rounded-xl text-xs font-bold transition"
          >
            <Plus size={12} /> Text
          </button>
          <button
            onClick={() => addField("number")}
            className="flex items-center justify-center gap-1 bg-purple-50 text-purple-700 hover:bg-purple-100 py-2 rounded-xl text-xs font-bold transition"
          >
            <Plus size={12} /> Number
          </button>
          <button
            onClick={() => addField("select")}
            className="flex items-center justify-center gap-1 bg-amber-50 text-amber-700 hover:bg-amber-100 py-2 rounded-xl text-xs font-bold transition"
          >
            <Plus size={12} /> Options
          </button>
        </div>
      </div>
    </div>
  );
}
