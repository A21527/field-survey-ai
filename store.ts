import { create } from "zustand";

export interface FormField {
  id: string;
  label: string;
  type: "text" | "number" | "select";
  value: string;
  options?: string[];
}

interface AppState {
  fields: FormField[];
  transcript: string[];
  isRecording: boolean;
  isExtracting: boolean;
  addField: (type: "text" | "number" | "select") => void;
  removeField: (id: string) => void;
  updateFieldValue: (id: string, value: string) => void;
  updateFieldLabel: (id: string, label: string) => void;
  addTranscriptLine: (text: string) => void;
  setRecordingStatus: (status: boolean) => void;
  extractFormValues: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  fields: [
    { id: "1", label: "Respondent Name", type: "text", value: "" },
    { id: "2", label: "Age", type: "number", value: "" },
    { id: "3", label: "Satisfaction Level", type: "select", value: "", options: ["High", "Medium", "Low"] },
  ],
  transcript: [],
  isRecording: false,
  isExtracting: false,

  addField: (type) => set((state) => ({
    fields: [
      ...state.fields,
      {
        id: crypto.randomUUID(),
        label: `Custom ${type.toUpperCase()} Field`,
        type,
        value: "",
        options: type === "select" ? ["Yes", "No"] : undefined,
      },
    ],
  })),

  removeField: (id) => set((state) => ({
    fields: state.fields.filter((f) => f.id !== id),
  })),

  updateFieldValue: (id, value) => set((state) => ({
    fields: state.fields.map((f) => (f.id === id ? { ...f, value } : f)),
  })),

  updateFieldLabel: (id, label) => set((state) => ({
    fields: state.fields.map((f) => (f.id === id ? { ...f, label } : f)),
  })),

  addTranscriptLine: (text) => set((state) => ({
    transcript: [...state.transcript, text],
  })),

  setRecordingStatus: (status) => set({ isRecording: status }),

  extractFormValues: async () => {
    const { transcript, fields } = get();
    const transcriptText = transcript.join("\n");

    if (!transcriptText || transcriptText.trim() === "") {
      return;
    }

    set({ isExtracting: true });

    try {
      const schemaLayout = fields.map((field) => ({
        id: field.id,
        label: field.label,
        type: field.type,
        options: field.options || [],
      }));

      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcriptText, schema: schemaLayout }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        set((state) => ({
          fields: state.fields.map((field) => ({
            ...field,
            value:
              result.data[field.id] !== undefined && result.data[field.id] !== null
                ? String(result.data[field.id])
                : field.value,
          })),
        }));
      } else {
        console.error("Extraction API returned invalid data", result);
      }
    } catch (error) {
      console.error("Failed to auto-extract data from transcript:", error);
    } finally {
      set({ isExtracting: false });
    }
  },
}));
