# FieldAgent AI - Comprehensive Project Brief

## 1. PROJECT OVERVIEW

**FieldAgent AI** is a Progressive Web Application (PWA) designed for field researchers and interviewers to conduct surveys with real-time AI-powered transcription and form data extraction. The system is built as a cloud-hosted solution running on AWS EC2.

### Core Purpose
- Enable field teams to conduct interviews using smartphones, tablets, and laptops
- Capture audio conversations in real-time
- Automatically transcribe audio using Whisper speech-to-text
- Extract structured form data from conversations using Llama 3 LLM
- Maintain data privacy and sync to a central database (CouchDB)
- Require no local server infrastructure—everything is cloud-based on AWS

### User Experience Flow
1. Interviewer opens PWA on mobile device (connected via internet/cellular)
2. Clicks "Start Voice Capture" to begin recording interview
3. Audio is captured locally on device, then streamed to AWS EC2 backend
4. Backend processes audio through Whisper to generate real-time transcript
5. Transcript appears live in the "Live Transcript" panel on the device
6. Llama 3 model extracts structured data from transcript and auto-populates survey form fields
7. Interviewer reviews and edits extracted values as needed
8. On form submission, all data syncs to CouchDB for persistence and later retrieval

---

## 2. TECH STACK & ARCHITECTURE

### Frontend (PWA - Current State)
- **Framework**: Next.js 16.2.6 with App Router
- **React**: 19.2.4 (client components)
- **Styling**: Tailwind CSS 4 + PostCSS
- **State Management**: Zustand 5.0.13
- **Icons**: Lucide React 1.16.0
- **Language**: TypeScript 5
- **Linting**: ESLint 9

### Backend (AWS EC2 - To Be Implemented)
- **Container Runtime**: Docker + Docker Compose
- **Base Image**: Linux (Ubuntu 22.04 recommended)
- **AI Models**:
  - **Speech-to-Text**: Faster-Whisper (hosted via Ollama)
  - **LLM**: Llama 3 8B Instruct (hosted via Ollama)
- **API Server**: Node.js/Express (or Python FastAPI - your choice)
- **Database**: CouchDB for data persistence and sync
- **API Communication**: REST endpoints over HTTPS

### Network Architecture
```
Device (PWA)
    ↓ (HTTPS over Cellular/WiFi)
AWS EC2 Instance
    ├─ Express/FastAPI Server (REST API)
    ├─ Ollama Service (Whisper + Llama 3)
    └─ CouchDB (Data persistence)
```

---

## 3. CURRENT IMPLEMENTATION STATUS

### ✅ COMPLETED FEATURES

#### 3.1 Frontend UI Components

**AudioPanel.tsx**
- Start/Stop recording button with visual status indicator
- Real-time timer displaying MM:SS format
- Microphone access with browser permission handling
- Audio compression using WebM/Ogg Opus codec
- Mock transcription pipeline (simulates 4-second intervals between phrases)
- Status metrics display (Session Status, Recording Duration, Audio Compression)
- System telemetry footer

**SurveyForm.tsx**
- Display dynamic form fields (initially: Respondent Name, Age, Satisfaction Level)
- Three field types: Text, Number, Select (dropdown)
- Edit field labels inline
- Delete individual fields
- Add new fields dynamically (Text, Number, or Select)
- Print/Export functionality
- Real-time field value updates through Zustand store

**TranscriptPanel.tsx**
- Display live transcript as lines appear
- Auto-scroll to newest transcript entries
- Shows mock transcription during recording
- "AI Extraction Engine Logs" console displaying:
  - Whisper streaming status
  - Llama model loading information
  - JSON schema mapping status
- Distinguishes between recording and idle states

**Main Layout (app/page.tsx)**
- Responsive 3-column grid layout (Audio, Survey Form, Transcript)
- Mobile view with tab switcher (Survey View / Live Transcript)
- Tablet/Desktop view with full multi-column display
- Application header with "Server Connected" status indicator
- Proper overflow and spacing for all screen sizes

#### 3.2 State Management (store.ts)
- Zustand store with full type safety
- State includes:
  - `fields`: Array of FormField objects with id, label, type, value, options
  - `transcript`: Array of transcript lines
  - `isRecording`: Boolean flag for recording state
- Actions implemented:
  - `addField()`: Create new field with random UUID
  - `removeField()`: Delete field by id
  - `updateFieldValue()`: Update field value
  - `updateFieldLabel()`: Update field label
  - `addTranscriptLine()`: Append transcript line
  - `setRecordingStatus()`: Toggle recording state

#### 3.3 Project Configuration
- Next.js configuration ready for deployment
- TypeScript strict mode enabled
- Path alias configured: `@/*` maps to project root (no `/src` directory)
- Tailwind CSS configured with dark mode support
- ESLint configured for Next.js

---

## 4. WHAT NEEDS TO BE IMPLEMENTED

### 🔧 PHASE 1: BACKEND API INFRASTRUCTURE

#### 4.1 Express Server Setup (Node.js/Express or FastAPI)
**Location**: Create `/server` directory at project root

**Requirements**:
- Create `server/index.js` (Express entry point)
- Environment configuration (`.env` file with EC2 details)
- CORS middleware to allow requests from frontend PWA
- Error handling and logging middleware
- Health check endpoint: `GET /health`

**Tech Stack Options**:
- Option A: Node.js + Express.js
- Option B: Python + FastAPI

**Dependencies to add**:
```json
{
  "express": "^4.18.0",
  "dotenv": "^16.0.0",
  "cors": "^2.8.5",
  "multer": "^1.4.5",
  "axios": "^1.4.0",
  "uuid": "^9.0.0"
}
```

**Key Endpoints to Create**:
1. `POST /api/transcribe` - Accept audio file, call Whisper, return transcript
2. `POST /api/extract-fields` - Accept transcript text, call Llama 3, return extracted JSON fields
3. `POST /api/submit-survey` - Accept completed survey data, save to CouchDB
4. `GET /api/surveys` - Retrieve all submitted surveys
5. `GET /health` - Health check for frontend connection validation

#### 4.2 Docker & Ollama Setup
**Location**: Create Dockerfile and docker-compose.yml in `/server` directory

**Requirements**:
- Dockerfile that:
  - Starts from Ubuntu 22.04 base image
  - Installs Node.js and npm (or Python)
  - Copies app files
  - Installs dependencies
  - Exposes ports 3001 (API), 11434 (Ollama)

- docker-compose.yml that orchestrates:
  - Express/FastAPI service (port 3001)
  - Ollama service (port 11434) with:
    - Whisper model pre-loaded
    - Llama 3 8B Instruct model pre-loaded
  - CouchDB service (port 5984)
  - Named volumes for model persistence

**Deployment Command**:
```bash
docker-compose up -d
```

#### 4.3 Database Schema (CouchDB)
**Requirements**:
- Create CouchDB initialization script
- Initialize database `surveys`
- Define document schema for survey submissions:
```json
{
  "_id": "unique-submission-id",
  "timestamp": "2026-05-21T10:30:00Z",
  "fields": [
    { "id": "field-1", "label": "Respondent Name", "value": "John Doe" },
    { "id": "field-2", "label": "Age", "value": "34" }
  ],
  "transcript": ["Line 1", "Line 2"],
  "recordingDuration": 125,
  "deviceInfo": { "type": "mobile", "os": "iOS" },
  "syncStatus": "synced"
}
```

### 🔌 PHASE 2: FRONTEND-BACKEND INTEGRATION

#### 4.2.1 API Service Layer
**Location**: Create `services/api.ts` or `services/apiClient.ts`

**Requirements**:
- Create reusable API client functions:
  - `uploadAudioAndTranscribe(audioBlob)` → returns transcript array
  - `extractFieldsFromTranscript(transcript)` → returns field suggestions
  - `submitSurvey(fields, transcript, metadata)` → saves to CouchDB
  - `checkServerConnection()` → validates backend is reachable
  - Error handling and retry logic with exponential backoff

**Implementation Details**:
- Use fetch API or axios
- Handle network failures gracefully
- Support offline queue (store failed requests locally, retry when online)
- Include request/response logging for debugging

#### 4.2.2 Replace Mock Transcription
**File**: Update `components/AudioPanel.tsx`

**Current State**:
- Uses hardcoded mock phrases injected every 4 seconds

**Required Changes**:
- Remove `mockIntervalRef` and mock phrase array
- After audio recording starts, collect audio chunks
- When recording stops (or at intervals), send audio blob to backend
- Call `POST /api/transcribe` endpoint
- Receive transcript lines and add them to store using `addTranscriptLine()`
- Display error messages if transcription fails
- Show loading indicator while transcription in progress

**Implementation**:
```typescript
// Pseudo-code flow
const stopRecording = async () => {
  // ... existing code ...
  
  const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
  try {
    const transcript = await uploadAudioAndTranscribe(audioBlob);
    transcript.forEach(line => addTranscriptLine(line));
  } catch (error) {
    console.error('Transcription failed:', error);
    addTranscriptLine(`[ERROR: ${error.message}]`);
  }
}
```

#### 4.2.3 Implement AI Field Extraction
**File**: Create new component `components/FieldExtractor.tsx` or add to `SurveyForm.tsx`

**Requirements**:
- Add "Auto-Fill from Transcript" button in SurveyForm
- On click, send current transcript to `POST /api/extract-fields`
- Backend calls Llama 3 with structured extraction prompt
- Receive JSON with suggested field values
- Display confirmation dialog showing suggestions
- Allow user to accept/reject suggestions
- Update form fields with accepted values

**Backend Llama 3 Prompt Template**:
```
You are a data extraction expert. Extract the following information from the interview transcript and return valid JSON:

TRANSCRIPT:
[transcript text here]

REQUIRED FIELDS:
[list of field labels and types]

Return ONLY valid JSON with no additional text. Example:
{"Respondent Name": "John Doe", "Age": "34", "Satisfaction Level": "High"}
```

#### 4.2.4 Form Submission & CouchDB Sync
**File**: Update `SurveyForm.tsx` and create `services/couchdb.ts`

**Requirements**:
- Add "Submit Survey" button at bottom of form
- On click, compile survey data:
  ```typescript
  {
    timestamp: new Date().toISOString(),
    fields: fields array,
    transcript: transcript array,
    recordingDuration: seconds,
    deviceInfo: { type: 'mobile', os: 'iOS', userAgent: navigator.userAgent }
  }
  ```
- Send to `POST /api/submit-survey`
- Show success/error toast notification
- Clear form after successful submission (optional, may want to restart)
- Implement local IndexedDB queue for offline submissions

#### 4.2.5 Server Connection Status
**File**: Update `app/page.tsx`

**Requirements**:
- Replace hardcoded "Server Connected" indicator
- Implement periodic health check: `GET /health` every 30 seconds
- Show green dot if server responds within 5 seconds
- Show red dot if server is unreachable
- Display appropriate status text: "Server Connected" or "Offline Mode"
- Queue data locally if server unreachable

### 📦 PHASE 3: ENVIRONMENT & DEPLOYMENT SETUP

#### 4.3.1 Environment Variables
**Location**: Create `.env.local` (gitignored) and `.env.example`

**Required Variables**:
```
# Backend Server Configuration
NEXT_PUBLIC_API_URL=http://your-ec2-instance-ip:3001
NEXT_PUBLIC_API_TIMEOUT=30000

# CouchDB Configuration
COUCHDB_URL=http://your-ec2-instance-ip:5984
COUCHDB_DATABASE=surveys

# Ollama Configuration
OLLAMA_BASE_URL=http://your-ec2-instance-ip:11434
WHISPER_MODEL=whisper-medium
LLM_MODEL=llama2

# App Configuration
NEXT_PUBLIC_APP_ENV=production
```

**Frontend Usage**:
- Use `NEXT_PUBLIC_API_URL` for API calls
- Make sure all environment variables are prefixed with `NEXT_PUBLIC_` to be available in browser

#### 4.3.2 Build & Deployment Configuration
**Requirements**:
- Update `next.config.ts` with:
  - PWA/manifest configuration for mobile app installation
  - Service worker setup for offline support
  - Image optimization settings
- Create `public/manifest.json` for PWA metadata
- Create `public/sw.js` for service worker (offline queue handling)

**PWA Features to Add**:
- Install prompt on mobile devices
- Offline data queuing
- Cache API responses for offline access
- Background sync for failed requests

#### 4.3.3 Docker Deployment Steps (For Engineer)
```bash
# 1. SSH into EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# 2. Clone repository
git clone your-repo-url
cd field-survey-ai

# 3. Create .env file with EC2 IP addresses
# 4. Build and deploy with Docker Compose
docker-compose up -d

# 5. Verify services are running
docker ps
curl http://localhost:3001/health
curl http://localhost:11434/api/tags

# 6. Deploy Next.js frontend to AWS S3 + CloudFront (or Vercel)
npm run build
npm start
```

### 🎯 PHASE 4: TESTING & REFINEMENT

#### 4.4.1 Integration Testing
- Test audio recording to transcription pipeline end-to-end
- Test field extraction accuracy with sample interviews
- Test offline functionality and data queuing
- Test mobile responsiveness across iOS and Android
- Test server failover and error handling

#### 4.4.2 Performance Optimization
- Optimize audio chunk size for transcription
- Implement audio streaming (don't wait until end to send)
- Add progress indicators for long-running operations
- Cache Whisper and Llama 3 model responses
- Optimize Tailwind CSS bundle size

#### 4.4.3 Security Hardening
- Implement JWT authentication for API requests
- Add rate limiting to backend endpoints
- Validate all user inputs on backend
- Use HTTPS for all communication
- Implement CORS properly (whitelist frontend domain)
- Sanitize data before storing in CouchDB

---

## 5. IMPLEMENTATION CHECKLIST FOR ENGINEER

### Backend Setup (Days 1-2)
- [ ] Create `/server` directory structure
- [ ] Set up Express.js or FastAPI server
- [ ] Create Docker and docker-compose configuration
- [ ] Set up Ollama with Whisper and Llama 3 models
- [ ] Create CouchDB Docker service with initialization script
- [ ] Implement API endpoints: `/health`, `/transcribe`, `/extract-fields`, `/submit-survey`
- [ ] Add error handling and logging middleware
- [ ] Test all endpoints locally with Postman/Insomnia

### Frontend Integration (Days 3-4)
- [ ] Create `services/api.ts` API client
- [ ] Create `services/couchdb.ts` for database operations
- [ ] Replace mock transcription in AudioPanel.tsx
- [ ] Implement real Whisper transcription flow
- [ ] Add "Auto-Fill from Transcript" feature
- [ ] Implement form submission and CouchDB sync
- [ ] Add server connection status checker
- [ ] Update store.ts with new actions if needed

### PWA & Offline Support (Day 5)
- [ ] Create `public/manifest.json`
- [ ] Set up service worker for offline queuing
- [ ] Update `next.config.ts` with PWA config
- [ ] Test installation on mobile devices
- [ ] Test offline functionality

### Deployment (Day 6)
- [ ] Create `.env.example` with required variables
- [ ] Document deployment process
- [ ] Deploy backend to AWS EC2
- [ ] Deploy frontend (Vercel or AWS S3 + CloudFront)
- [ ] End-to-end testing from mobile device

### Refinement (Day 7)
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Bug fixes and polish
- [ ] Documentation updates

---

## 6. KEY TECHNICAL DECISIONS

### API Communication
- **Protocol**: REST with JSON payloads (simpler than GraphQL for this use case)
- **Audio Format**: WebM with Opus codec (good compression ratio)
- **Transcript Format**: Array of strings (one line per sentence)

### Error Handling Strategy
- Frontend: Show toast notifications for errors
- Backend: Return proper HTTP status codes with error messages
- Offline: Queue failed requests, retry with exponential backoff when online

### Data Sync Strategy
- Use CouchDB's built-in replication for eventual consistency
- Store local copy in IndexedDB on device
- Sync when online, queue when offline

### Security
- All API calls over HTTPS
- Validate JWT tokens on backend
- Rate limit transcription API (avoid abuse)
- Never send raw audio to unsecured endpoints

---

## 7. DELIVERABLES CHECKLIST

When the engineer completes the project, verify:

- [ ] Backend server running and accessible from mobile device
- [ ] Real audio transcription working (not mock)
- [ ] Fields auto-populate from transcript using Llama 3
- [ ] Survey submissions save to CouchDB
- [ ] Server connection status indicator works
- [ ] Offline mode queues requests and retries
- [ ] Mobile responsive design works on iOS and Android
- [ ] PWA installable on mobile devices
- [ ] All environment variables properly documented
- [ ] Docker deployment works with single `docker-compose up` command
- [ ] No console errors or warnings
- [ ] Load tested with simulated concurrent users

---

## 8. ADDITIONAL NOTES

- The frontend is production-ready in UI/UX. Focus backend integration on reliability and performance.
- The mock transcription is intentionally kept in the code for demo purposes—it should only be used if the backend is unreachable.
- Consider implementing a "demo mode" toggle for testing without a backend.
- Store form definitions (field schemas) in a template system so they can be customized per survey type.
- Log all transcription and field extraction for debugging and quality assurance.
