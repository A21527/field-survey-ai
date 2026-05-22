# FieldAgent AI - Full Functionality & Progress Report

## EXECUTIVE SUMMARY

**FieldAgent AI** is a cloud-based Progressive Web Application (PWA) for field researchers to conduct AI-assisted interviews. The system captures audio, transcribes it in real-time using Whisper AI, extracts structured survey data using Llama 3, and stores everything in a cloud database. It requires zero internet connectivity during interviews (all processing happens on a central AWS EC2 server that teams connect to remotely).

---

## PART 1: INTENDED FUNCTIONALITY (End-User Perspective)

### 1.1 User Journey: Start to Finish

#### Step 1: Field Team Arrives at Survey Location
- Team members connect their smartphones/tablets to the internet (cellular data or WiFi hotspot)
- They open the FieldAgent AI PWA in their browser
- The app displays the main interface with three sections visible:
  - **Left**: Audio controls (recording panel)
  - **Center**: Survey form with pre-defined fields
  - **Right**: Live transcript of the interview

#### Step 2: Begin Interview Session
- Interviewer clicks **"Start Voice Capture"** button
- Audio recording starts from the device microphone
- Button changes to red and displays **"Stop Interview"** with pulse animation
- Real-time timer shows MM:SS format (00:00, 00:01, etc.)
- Status indicator shows "Streaming Audio" instead of "Idle"

#### Step 3: Conduct Interview
- As the respondent speaks, their voice is captured and streamed to AWS EC2 backend
- Backend processes audio through Whisper (speech-to-text)
- Transcribed text appears **live** in the "Live Transcript" panel
- Each transcribed sentence appears as a separate card with label "INTERVIEWEE:"
- AI Extraction Engine automatically analyzes transcript and fills in survey form fields
- Example: If respondent says "My name is John Doe and I'm 34 years old", the system should auto-fill:
  - "Respondent Name" → "John Doe"
  - "Age" → "34"

#### Step 4: Review & Adjust Survey Answers
- Interviewer reviews the auto-filled form fields
- Can manually edit any field if AI extraction was incorrect
- Can add new survey questions on-the-fly (Text, Number, or Select/Dropdown)
- Can delete fields if not needed
- Sees real-time AI confidence logs in the "AI Extraction Engine Logs" panel

#### Step 5: Complete Interview
- Interviewer clicks **"Stop Interview"** button
- Audio recording stops
- Transcription stops
- All remaining data is flushed to backend

#### Step 6: Submit Survey
- Interviewer clicks **"Submit Survey"** button (to be added)
- App sends:
  - All form field responses
  - Full interview transcript
  - Recording duration
  - Device metadata (phone type, OS)
  - Timestamp
- Backend saves to CouchDB
- App shows success notification: "Survey submitted successfully"
- (Optional) Form clears and resets for next interview

#### Step 7: Offline Resilience (if internet drops)
- If cellular connection is lost during interview:
  - App queues the audio/form data locally
  - Shows "Offline Mode" indicator
  - Continues to allow recording and form editing
  - Automatically retries submission when connection returns
  - Shows "Syncing..." status during retry

#### Step 8: Data Synchronization
- All submitted surveys are stored on AWS EC2 in CouchDB
- Research team can access survey data:
  - Via web dashboard (backend admin panel)
  - Via API for analysis
  - Via export (CSV/JSON) for reporting

---

### 1.2 Core Features

#### Audio Recording
- ✅ **Implemented**: Start/stop recording with visual feedback
- ✅ **Implemented**: Real-time timer (MM:SS format)
- ✅ **Implemented**: Microphone permission handling
- ✅ **Implemented**: Audio compression (WebM/Ogg Opus codec)
- ❌ **Not Yet**: Actual audio streaming to backend (mock only)
- ❌ **Not Yet**: Audio quality indicators (bitrate, sample rate)

#### Real-Time Transcription
- ✅ **Implemented**: UI for displaying transcript
- ✅ **Implemented**: Auto-scroll to latest transcript line
- ❌ **Not Yet**: Real Whisper integration (mock phrases only)
- ❌ **Not Yet**: Streaming transcription (currently waiting for full audio)

#### AI Field Extraction
- ✅ **Implemented**: Survey form with dynamic fields
- ❌ **Not Yet**: Llama 3 integration to extract field values
- ❌ **Not Yet**: Confidence scores for AI suggestions
- ❌ **Not Yet**: Manual override/correction UI

#### Survey Form Management
- ✅ **Implemented**: Create new fields (Text, Number, Select)
- ✅ **Implemented**: Edit field labels
- ✅ **Implemented**: Delete fields
- ✅ **Implemented**: Pre-populated default fields (Name, Age, Satisfaction)
- ✅ **Implemented**: Edit field values
- ❌ **Not Yet**: Field templates (save/load common survey schemas)
- ❌ **Not Yet**: Field validation rules
- ❌ **Not Yet**: Conditional field logic (show field X only if field Y = value Z)

#### Data Persistence
- ❌ **Not Yet**: Submit button and submission logic
- ❌ **Not Yet**: CouchDB integration
- ❌ **Not Yet**: Offline IndexedDB queue
- ❌ **Not Yet**: Data sync on reconnection

#### Mobile Responsiveness
- ✅ **Implemented**: Tab switcher for mobile (Survey View / Live Transcript)
- ✅ **Implemented**: Full desktop multi-column layout
- ✅ **Implemented**: Tablet intermediate layout
- ✅ **Implemented**: Responsive typography and spacing

#### Server Connection Status
- ✅ **Implemented**: Visual indicator in header (green dot + "Server Connected")
- ❌ **Not Yet**: Actual health check to backend
- ❌ **Not Yet**: Dynamic status updates (green/red based on connectivity)
- ❌ **Not Yet**: Offline mode indicator

#### Print/Export
- ✅ **Implemented**: Print button that opens browser print dialog
- ❌ **Not Yet**: PDF export with better formatting
- ❌ **Not Yet**: CSV/JSON export of submissions

---

## PART 2: CURRENT ARCHITECTURE (AWS EC2 Cloud-Hosted)

### 2.1 Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FIELD DEVICES                            │
│  (Smartphones, Tablets, Laptops with Cellular/WiFi)          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTPS Requests
                       │ (Cellular Data or WiFi)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    AWS EC2 INSTANCE                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Express.js API Server (Port 3001)                   │   │
│  │  ├─ POST /api/transcribe                             │   │
│  │  ├─ POST /api/extract-fields                         │   │
│  │  ├─ POST /api/submit-survey                          │   │
│  │  └─ GET /health                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Ollama Service (Port 11434)                         │   │
│  │  ├─ Whisper Model (speech-to-text)                   │   │
│  │  └─ Llama 3 8B Instruct (field extraction)           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  CouchDB (Port 5984)                                 │   │
│  │  └─ Database: "surveys"                              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | Next.js | 16.2.6 | Framework for PWA |
| | React | 19.2.4 | UI components |
| | TypeScript | 5.0 | Type safety |
| | Tailwind CSS | 4.0 | Styling |
| | Zustand | 5.0.13 | State management |
| | Lucide React | 1.16.0 | Icons |
| **Backend** | Node.js + Express | LTS | API server |
| | Docker | Latest | Containerization |
| **AI/ML** | Ollama | Latest | Model serving |
| | Whisper | Medium | Speech-to-text |
| | Llama 3 | 8B Instruct | LLM for extraction |
| **Database** | CouchDB | 3.x | Document store + sync |
| **Deployment** | AWS EC2 | Ubuntu 22.04 | Cloud infrastructure |

### 2.3 Data Flow for Each Operation

#### Data Flow: Start Recording
```
User clicks "Start Voice Capture"
    ↓
Browser requests microphone permission
    ↓
User approves (device shows mic indicator)
    ↓
MediaRecorder API starts capturing audio
    ↓
Timer starts incrementing
    ↓
UI updates: button turns red, shows "Stop Interview"
```

#### Data Flow: Audio Transcription (CURRENT - MOCK)
```
Audio recording in progress
    ↓
MockInterval fires every 4 seconds
    ↓
Mock phrase injected into transcript store
    ↓
TranscriptPanel re-renders with new line
    ↓
Auto-scroll to bottom shows latest phrase
```

#### Data Flow: Audio Transcription (NEEDED - REAL)
```
Audio recording in progress
    ↓
Audio chunks collected (every 1 second)
    ↓
Chunk sent to: POST /api/transcribe
    ↓
Backend receives audio blob
    ↓
Ollama Whisper processes audio chunk
    ↓
Backend returns: { transcript: "string", confidence: 0.95 }
    ↓
Frontend adds to transcript store
    ↓
TranscriptPanel re-renders with new line
    ↓
Auto-scroll to bottom shows latest transcribed text
```

#### Data Flow: Field Extraction (NEEDED)
```
User clicks "Auto-Fill from Transcript" button
    ↓
Frontend collects all transcript lines
    ↓
Sends: POST /api/extract-fields
    Body: { transcript: ["line1", "line2", ...], fieldLabels: ["Name", "Age", ...] }
    ↓
Backend constructs Llama 3 prompt
    ↓
Ollama LLM processes prompt and generates JSON
    ↓
Backend returns: { "Name": "John", "Age": "34", ... }
    ↓
Frontend shows confirmation dialog
    ↓
User accepts or rejects suggestions
    ↓
Store updates with suggested values
    ↓
SurveyForm component re-renders with auto-filled values
```

#### Data Flow: Submit Survey (NEEDED)
```
User clicks "Submit Survey" button
    ↓
Frontend validates all required fields filled
    ↓
Compiles submission payload:
  {
    timestamp: "2026-05-21T10:30:00Z",
    fields: [{id, label, value}, ...],
    transcript: ["line1", "line2", ...],
    recordingDuration: 125,
    deviceInfo: {os: "iOS", browser: "Safari", ...}
  }
    ↓
Sends: POST /api/submit-survey
    ↓
Backend receives payload
    ↓
Generates unique ID (UUID)
    ↓
Saves to CouchDB.surveys collection
    ↓
Returns: { success: true, id: "uuid-123" }
    ↓
Frontend shows success toast: "Survey submitted!"
    ↓
(Optional) Form resets for next interview
```

---

## PART 3: CURRENT PROGRESS - WHAT'S WORKING

### 3.1 Frontend UI (100% Complete)

#### AudioPanel.tsx - Field Controller Panel
**Status**: ✅ COMPLETE & FUNCTIONAL

**What it does**:
- Displays large blue "Start Voice Capture" button
- When recording: shows red "Stop Interview" button with pulse animation
- Real-time timer shows MM:SS format (updates every second)
- Status metrics display:
  - Session Status: "Streaming Audio" or "Idle"
  - Recording Duration: formatted time
  - Audio Compression: "Ogg/Opus (Lightweight)"
- System telemetry footer (placeholder for real metrics)
- Requests microphone permission on start
- Gracefully handles permission denial

**Code Quality**: Production-ready, clean component structure

**Dependencies**: React hooks, Zustand store, Lucide icons

---

#### SurveyForm.tsx - Dynamic Survey Fields
**Status**: ✅ COMPLETE & FUNCTIONAL

**What it does**:
- Displays default fields:
  - "Respondent Name" (Text input)
  - "Age" (Number input)
  - "Satisfaction Level" (Select dropdown: High/Medium/Low)
- Users can:
  - Edit field labels (inline editing)
  - Edit field values
  - Delete individual fields
  - Add new fields (Text, Number, or Select)
- Print/Export button opens browser print dialog
- Fields are fully editable and state is persisted in Zustand store
- Responsive layout that works on mobile, tablet, and desktop

**Code Quality**: Production-ready, clean component structure

**Limitations**: 
- No field validation
- No conditional field logic
- No field templates

---

#### TranscriptPanel.tsx - Live Interview Transcript
**Status**: ✅ UI COMPLETE, 50% FUNCTIONAL (mock only)

**What it does**:
- Displays interview transcript as an array of lines
- Each line appears as a card with "INTERVIEWEE:" label
- Auto-scrolls to bottom when new lines added
- Shows "Awaiting transmission activation" when idle
- Shows "Listening closely... Speak into microphone" when recording
- Includes "AI Extraction Engine Logs" console:
  - Displays "Streaming Whisper speech tokens" when recording
  - Shows "Loaded model weights: Llama-3-8B-Instruct"
  - Shows "JSON response schemas mapped dynamically"

**Code Quality**: Production-ready, clean component structure

**Limitations**: 
- Uses mock phrases (hardcoded, not real transcription)
- No actual Whisper integration
- No actual LLM log output (placeholder text only)

---

#### Main Layout (app/page.tsx)
**Status**: ✅ COMPLETE & RESPONSIVE

**What it does**:
- Three-column grid layout for desktop/tablet:
  - Left (1 column): AudioPanel
  - Center (2 columns): SurveyForm
  - Right (1 column): TranscriptPanel
- Mobile view with tab switcher (Survey View / Live Transcript)
- Application header with branding and "Server Connected" indicator
- Proper spacing, padding, and overflow handling
- Sticky tab selector on mobile
- Shadow and border styling for visual hierarchy

**Code Quality**: Production-ready, responsive design

**Browser Compatibility**: Works on modern browsers (Chrome, Safari, Firefox, Edge)

---

### 3.2 State Management (store.ts - 100% Complete)

**Status**: ✅ COMPLETE & FUNCTIONAL

**Zustand Store Definition**:
```typescript
interface FormField {
  id: string
  label: string
  type: "text" | "number" | "select"
  value: string
  options?: string[]
}

interface AppState {
  fields: FormField[]
  transcript: string[]
  isRecording: boolean
  addField: (type) => void
  removeField: (id) => void
  updateFieldValue: (id, value) => void
  updateFieldLabel: (id, label) => void
  addTranscriptLine: (text) => void
  setRecordingStatus: (status) => void
}
```

**Implemented Actions**:
- ✅ `addField()` - Creates new field with random UUID
- ✅ `removeField()` - Deletes field by ID
- ✅ `updateFieldValue()` - Updates a field's value
- ✅ `updateFieldLabel()` - Updates a field's label
- ✅ `addTranscriptLine()` - Appends transcript line
- ✅ `setRecordingStatus()` - Toggles recording state

**Performance**: Optimized with Zustand selectors, no unnecessary re-renders

---

### 3.3 Project Configuration
**Status**: ✅ COMPLETE

- ✅ Next.js 16.2.6 configured
- ✅ TypeScript strict mode enabled
- ✅ Tailwind CSS configured with dark mode support
- ✅ ESLint configured for Next.js
- ✅ Path alias `@/*` correctly mapped to project root
- ✅ PostCSS configured
- ✅ Package.json with all dependencies

**Build Status**: ✅ No compilation errors (after import path fixes)

---

## PART 4: WHAT NEEDS TO BE IMPLEMENTED NEXT

### Phase 1: Backend API Server (Priority: CRITICAL)

#### 1.1 Create Backend Server Structure
**What Needs to Be Built**:
- Create `/server` directory in project root
- Set up Node.js + Express.js application
- Create entry point: `server/index.js`
- Implement CORS middleware (allow requests from frontend URL)
- Implement error handling middleware
- Implement logging middleware

**Deliverable**:
- Express server listening on port 3001
- Health check endpoint: `GET /api/health`
- Returns: `{ status: "ok", timestamp: "2026-05-21T..." }`

**Estimated Effort**: 2-4 hours

---

#### 1.2 Create Transcription Endpoint
**What Needs to Be Built**:
- Endpoint: `POST /api/transcribe`
- Accepts: Audio blob/file from frontend
- Processes: Sends audio to Ollama Whisper model
- Returns: Array of transcribed text lines

**Request Format**:
```typescript
POST /api/transcribe
Content-Type: multipart/form-data

Form Data:
- audio: File (audio/webm or audio/ogg)
```

**Response Format**:
```json
{
  "success": true,
  "transcript": [
    "Hello, my name is John Doe.",
    "I am thirty-four years old.",
    "I am satisfied with the service."
  ],
  "confidence": 0.92,
  "duration": 12.5
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Whisper model unavailable"
}
```

**Implementation Details**:
- Use `multer` middleware to handle file upload
- Use `axios` or `node-fetch` to call Ollama API
- Ollama endpoint: `http://localhost:11434/api/generate`
- Send audio file to Whisper model
- Parse Whisper response and format as array of lines

**Estimated Effort**: 4-6 hours

---

#### 1.3 Create Field Extraction Endpoint
**What Needs to Be Built**:
- Endpoint: `POST /api/extract-fields`
- Accepts: Transcript array + field labels
- Processes: Sends to Ollama Llama 3 model with extraction prompt
- Returns: Extracted field values as JSON

**Request Format**:
```json
POST /api/extract-fields
Content-Type: application/json

{
  "transcript": [
    "My name is John Doe",
    "I am 34 years old",
    "I am very satisfied"
  ],
  "fieldLabels": ["Respondent Name", "Age", "Satisfaction Level"]
}
```

**Response Format**:
```json
{
  "success": true,
  "extractedFields": {
    "Respondent Name": "John Doe",
    "Age": "34",
    "Satisfaction Level": "very satisfied"
  },
  "confidence": 0.87
}
```

**Implementation Details**:
- Construct Llama 3 prompt with transcript and required fields
- Call Ollama LLM endpoint: `http://localhost:11434/api/generate`
- Model: `llama2` or `llama3`
- Request JSON extraction, not prose
- Parse LLM response (may need JSON extraction from text)
- Return structured field values

**Estimated Effort**: 6-8 hours (LLM prompt engineering is tricky)

---

#### 1.4 Create Survey Submission Endpoint
**What Needs to Be Built**:
- Endpoint: `POST /api/submit-survey`
- Accepts: Complete survey data + transcript + metadata
- Processes: Saves to CouchDB
- Returns: Success confirmation with submission ID

**Request Format**:
```json
POST /api/submit-survey
Content-Type: application/json

{
  "fields": [
    {"id": "1", "label": "Respondent Name", "value": "John Doe"},
    {"id": "2", "label": "Age", "value": "34"}
  ],
  "transcript": ["Line 1", "Line 2", ...],
  "recordingDuration": 125,
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "timezone": "UTC-5"
  }
}
```

**Response Format**:
```json
{
  "success": true,
  "submissionId": "uuid-12345",
  "timestamp": "2026-05-21T10:30:00Z"
}
```

**Implementation Details**:
- Generate UUID for submission
- Add server-side timestamp
- Validate all required fields present
- Connect to CouchDB
- Insert document into `surveys` database
- Handle connection errors gracefully

**Estimated Effort**: 4-6 hours

---

#### 1.5 Create Retrieval Endpoint (Bonus)
**What Needs to Be Built**:
- Endpoint: `GET /api/surveys`
- Query parameters: `?limit=10&skip=0`
- Processes: Fetches surveys from CouchDB
- Returns: Array of submitted surveys

**Response Format**:
```json
{
  "success": true,
  "surveys": [
    {
      "_id": "uuid-123",
      "timestamp": "2026-05-21T10:30:00Z",
      "fields": [...],
      "transcript": [...]
    }
  ],
  "total": 150,
  "returned": 10
}
```

**Estimated Effort**: 2-3 hours

---

### Phase 2: Docker & Infrastructure Setup (Priority: HIGH)

#### 2.1 Create Dockerfile
**What Needs to Be Built**:
- Dockerfile for Express.js server + Ollama + CouchDB orchestration
- Install Node.js, npm dependencies
- Expose ports 3001, 11434, 5984
- Set environment variables
- Health check command

**Estimated Effort**: 2-3 hours

---

#### 2.2 Create docker-compose.yml
**What Needs to Be Built**:
- Service: Express API (port 3001)
- Service: Ollama with Whisper + Llama 3 (port 11434)
- Service: CouchDB (port 5984)
- Volume: Persist model weights and database
- Network: Internal communication between services

**Estimated Effort**: 3-4 hours

---

#### 2.3 Set Up CouchDB Database
**What Needs to Be Built**:
- Initialize `surveys` database
- Create document schema/validation rules
- Set up replication (optional, for backup)
- Create admin user with credentials

**Estimated Effort**: 1-2 hours

---

### Phase 3: Frontend-Backend Integration (Priority: HIGH)

#### 3.1 Create API Client Service
**What Needs to Be Built**:
- File: `services/api.ts`
- Functions:
  - `transcribeAudio(audioBlob): Promise<string[]>`
  - `extractFields(transcript, labels): Promise<object>`
  - `submitSurvey(data): Promise<{id, success}>`
  - `checkServerHealth(): Promise<boolean>`
- Error handling with retry logic
- Timeout handling (30 seconds default)
- Request/response logging

**Estimated Effort**: 4-6 hours

---

#### 3.2 Integrate Real Transcription in AudioPanel.tsx
**What Needs to Be Built**:
- Replace mock phrases with real transcription
- On recording stop, send audio blob to backend
- Receive transcript array from API
- Add each line to store using `addTranscriptLine()`
- Show loading spinner while transcribing
- Show error toast if transcription fails

**Code Changes**:
```typescript
// Replace this:
const mockPhrases = [...]
mockIntervalRef.current = setInterval(() => { ... })

// With this:
const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
try {
  const transcript = await transcribeAudio(audioBlob)
  transcript.forEach(line => addTranscriptLine(line))
} catch (err) {
  addTranscriptLine(`[ERROR: ${err.message}]`)
}
```

**Estimated Effort**: 3-4 hours

---

#### 3.3 Add Field Auto-Extraction Feature
**What Needs to Be Built**:
- Add "Auto-Fill from Transcript" button in SurveyForm
- On click, call `/api/extract-fields` endpoint
- Show confirmation dialog with suggested values
- Let user accept/reject each suggestion
- Update form fields with accepted values

**UI Addition**:
```typescript
<button onClick={handleAutoFill}>
  ✨ Auto-Fill from Transcript
</button>

// Modal dialog:
// "AI suggests the following values. Accept?"
// - Respondent Name: John Doe (Accept / Reject)
// - Age: 34 (Accept / Reject)
// - Satisfaction Level: High (Accept / Reject)
```

**Estimated Effort**: 4-6 hours

---

#### 3.4 Implement Form Submission
**What Needs to Be Built**:
- Add "Submit Survey" button at bottom of SurveyForm
- On click, validate all fields filled
- Call `/api/submit-survey` endpoint
- Show success/error toast notification
- Clear form after successful submission (optional)

**Code Addition**:
```typescript
const handleSubmit = async () => {
  const payload = {
    fields: fields,
    transcript: transcript,
    recordingDuration: seconds,
    deviceInfo: {
      userAgent: navigator.userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  }
  
  try {
    const result = await submitSurvey(payload)
    showToast(`Survey submitted! ID: ${result.id}`)
  } catch (err) {
    showToast(`Submission failed: ${err.message}`)
  }
}
```

**Estimated Effort**: 3-4 hours

---

#### 3.5 Implement Server Connection Status
**What Needs to Be Built**:
- Create health check function in api.ts
- Call `/health` endpoint every 30 seconds
- Update store with connection status (connected/offline)
- Display dynamic indicator in header (green/red dot)
- Show "Server Connected" or "Offline Mode"

**Code Addition**:
```typescript
useEffect(() => {
  const checkHealth = async () => {
    try {
      const response = await fetch(`${API_URL}/health`, { timeout: 5000 })
      setServerConnected(response.ok)
    } catch {
      setServerConnected(false)
    }
  }
  
  const interval = setInterval(checkHealth, 30000)
  return () => clearInterval(interval)
}, [])
```

**Estimated Effort**: 2-3 hours

---

### Phase 4: Environment & Configuration (Priority: MEDIUM)

#### 4.1 Create Environment Variables
**What Needs to Be Built**:
- Create `.env.local` file (gitignored)
- Create `.env.example` file (for documentation)

**Variables Required**:
```
NEXT_PUBLIC_API_URL=http://your-ec2-ip:3001
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_APP_ENV=production
```

**Estimated Effort**: 0.5 hours

---

#### 4.2 Update next.config.ts for PWA
**What Needs to Be Built**:
- Configure PWA plugin
- Add manifest.json configuration
- Set service worker entry point
- Enable offline mode

**Estimated Effort**: 2-3 hours

---

#### 4.3 Create Service Worker
**What Needs to Be Built**:
- File: `public/sw.js`
- Implement offline request queuing
- Cache API responses
- Background sync on reconnection

**Estimated Effort**: 4-6 hours

---

### Phase 5: Testing & Deployment (Priority: MEDIUM)

#### 5.1 Local Testing
**What Needs to Be Done**:
- Test all endpoints with Postman/Insomnia
- Test frontend integration locally
- Test mobile responsiveness on actual device
- Test offline mode

**Estimated Effort**: 4-6 hours

---

#### 5.2 EC2 Deployment
**What Needs to Be Done**:
- SSH into EC2 instance
- Clone repository
- Create `.env` file with EC2 IP
- Run `docker-compose up -d`
- Verify all services running
- Update frontend `.env.local` with EC2 IP
- Deploy frontend

**Estimated Effort**: 2-3 hours

---

#### 5.3 Performance Optimization
**What Needs to Be Done**:
- Profile audio streaming performance
- Optimize Whisper model loading
- Optimize LLM prompt for faster extraction
- Reduce bundle size of frontend

**Estimated Effort**: 4-6 hours

---

## PART 5: IMMEDIATE NEXT STEPS (Prioritized)

### Week 1 Priority (CRITICAL - Must Complete):

1. **Create `/server` directory and Express.js setup** (4 hours)
   - Get basic server running on port 3001
   - Implement CORS and error handling
   - Create `/health` endpoint

2. **Create docker-compose.yml** (4 hours)
   - Set up Ollama service with models
   - Set up CouchDB service
   - Test local docker setup

3. **Implement `/api/transcribe` endpoint** (6 hours)
   - Connect to Ollama Whisper
   - Handle audio file upload
   - Return transcript array

4. **Create API client service** (5 hours)
   - Build `services/api.ts` with all functions
   - Add error handling and retry logic
   - Add request logging

5. **Integrate real transcription in AudioPanel** (4 hours)
   - Replace mock with real API calls
   - Show loading state during transcription
   - Handle errors gracefully

### Week 2 Priority (HIGH):

6. **Implement `/api/extract-fields` endpoint** (7 hours)
   - LLM prompt engineering
   - JSON parsing from LLM output
   - Confidence scoring

7. **Add field auto-extraction UI** (5 hours)
   - "Auto-Fill from Transcript" button
   - Confirmation dialog
   - Update form with suggestions

8. **Implement `/api/submit-survey` endpoint** (5 hours)
   - CouchDB integration
   - UUID generation
   - Error handling

9. **Add form submission UI** (3 hours)
   - Submit button
   - Success/error toast
   - Form reset

### Week 3 Priority (MEDIUM):

10. **Server connection status indicator** (3 hours)
11. **Environment variables and configuration** (2 hours)
12. **PWA setup and service worker** (6 hours)
13. **Testing and optimization** (6 hours)
14. **EC2 deployment** (3 hours)

---

## PART 6: SUCCESS CRITERIA

The project is **complete** when:

- [ ] User can start recording and see real Whisper transcription (not mock)
- [ ] User can click "Auto-Fill" and form fields populate from transcript
- [ ] User can submit survey and data saves to CouchDB
- [ ] Server connection status indicator shows correct status
- [ ] App works offline and syncs when reconnected
- [ ] Mobile responsive design works on iOS and Android
- [ ] All API endpoints have proper error handling
- [ ] No console errors or warnings
- [ ] Backend runs with single `docker-compose up` command
- [ ] End-to-end test: record interview → transcribe → extract → submit → verify in database

---

## PART 7: ARCHITECTURE DECISIONS SUMMARY

**Why Cloud-Hosted (AWS EC2)?**
- Simpler infrastructure than local server
- Team can work from anywhere with internet
- One central server instead of per-location setup
- Easier to maintain models (Whisper, Llama 3)
- Scales horizontally by adding more EC2 instances

**Why CouchDB?**
- Built-in replication for sync
- Works offline with local copies
- NoSQL flexibility for varied survey schemas
- Easy data export to JSON/CSV

**Why Ollama?**
- Open-source, runs locally on EC2
- Supports multiple models (Whisper, Llama 3)
- No cloud vendor lock-in
- Fast inference on GPU-enabled EC2

**Why PWA Instead of Native App?**
- Works on iOS and Android without app store
- Easier deployment (just update web files)
- Works in any browser
- Offline support via service workers
- Faster development cycle

---
