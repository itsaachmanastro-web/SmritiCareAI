# SmritiCare — AI for Brighter Minds

**Smart India Hackathon 2026 Prototype**  
**Problem Statement:** SIH26003 (AI-powered, voice-first cognitive care for elderly dementia patients in India's North Eastern Region)  
**Team:** AvishkarX  
**Tagline:** Technology with Empathy, for Healthier Tomorrows  
**Footer Moto:** Inclusive Minds. Stronger Communities.

---

## 🌟 Overview

**SmritiCare** is a production-grade, elder-friendly, voice-first web application engineered specifically for elderly dementia and Mild Cognitive Impairment (MCI) patients in the North Eastern Region (NER) of India. 

The application is built with a **100% offline-first local architecture** using **Dexie.js (IndexedDB)**, allowing patients and community health workers in remote tea-estate hamlets with unstable internet to engage in daily cognitive exercises and schedule care without interruption or data loss.

---

## 🚀 Quick Start (Runs Standalone, Zero API Keys)

```bash
# 1. Clone or navigate into the repository
cd SMRITICARE

# 2. Install dependencies
npm install

# 3. Start the local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Dual Visual Modes & Demo Accounts

The application provides tailored UX modes driven by role at login:

### 1. Patient Mode (Elder-Friendly First)
- **Design:** Extra-large typography (18–24px base), minimum 56px tap targets, tactile buttons, high-contrast warm palette (warm teal & terracotta), conversational speech-bubble UI.
- **Login:** Big 4-digit PIN pad or 1-tap photo login. No typing required.
- **Demo Account:** **Bimala Borah (Amma)** (PIN: `1234`)

### 2. Caregiver & Healthcare Mode (Data-Forward)
- **Design:** Denser analytical dashboard with 30-day interactive Recharts, automated clinical decline alerts, daily care schedule manager, and exportable weekly tele-care reports.
- **Demo Accounts:**
  - **Priya Borah** (Family Caregiver) — `priya@smriticare.org`
  - **Dr. Arun Phukan** (PHC Medical Officer) — `phukan@health.assam.gov.in`

*(Tip for Judges: Every login screen includes an instant **"⚡ Try Demo Account"** button to jump directly into the experience with zero friction!)*

---

## 🎮 The 4 Culturally Grounded North East India Games

All games feature authentic North Eastern Indian motifs and culturally grounded themes:

1. **"Bihu Memory Bihu" (Memory Improvement):**
   - Match-pairs game featuring vector SVG cultural artifacts: *Assam Gamosa, Jaapi sun hat, Xorai brass offering tray, Pepa horn, Kaziranga Rhino, Hornbill bird, Bamboo dance sticks, and Tea leaf*.
   - **AI-Adaptive Engine:** Starts at 6 pairs; automatically adapts down to 4 pairs or up to 8 pairs based on player history.

2. **"Mekhela Pattern Match" (Pattern & Object Recognition):**
   - Identifies missing geometric weaving motifs (*Muga Kingkhap, Assam Kesu peacock, Naga Chevron, Mizo Puan*) on traditional textile border strips.

3. **"Morning at the Tea Garden" (Daily Routine Recall):**
   - Sequencing game set in a peaceful tea garden hamlet: *Wake up with morning sun ➔ Wash with fresh hill water ➔ Sip warm Assam Lal Cha ➔ Morning breakfast ➔ Medicine*.

4. **"Sounds of the Hills" (Attention & Concentration):**
   - Visual and audio focus game: browser announces target instruments (*Pepa horn, Dhol drum, Toka clapper, Hornbill call*) with synthesized instrument sound. Player taps target under a countdown timer.

---

## 💾 Offline-First Local Database Architecture

| Table | Purpose |
|---|---|
| `users` | Local patient and caregiver profiles with avatars and credentials |
| `gameSessions` | Historical game records, accuracy, duration, mistakes, and difficulty |
| `cognitiveScores` | 30-day historical scores per domain (*Memory, Attention, Routine, Pattern*) |
| `reminders` | Daily schedules (medicines, water, walk) with live completion statuses |
| `syncQueue` | Real offline queue recording all offline mutations for batch synchronization |

### What's Real vs. What's Mocked

- **Real:**
  - **IndexedDB (Dexie.js):** 100% real persistent browser database. Changes survive page refreshes, browser restarts, and offline mode.
  - **Adaptive Difficulty Engine:** Computes real session histories to elevate or relax difficulty levels.
  - **Clinical Alerts Engine:** Analyzes 30 days of Dexie cognitive records to detect 5-day score drops and missed reminders in real time.
  - **Caregiver Reminders:** When a caregiver adds or deletes a reminder, the patient screen updates live via Dexie reactive hooks.
  - **Audio Synthesis:** Real Web Audio API synthesizer for folk instruments (Pepa horn, Dhol beats, Toka clicks) and Web Speech API (`SpeechSynthesis`) for spoken voice instructions.
  - **Offline Detection:** Monitors `navigator.onLine` and updates the header sync pill ("🟢 Synced" / "🟠 Offline").

- **Mocked:**
  - **Cloud Sync Relay:** A simulated sync service that processes the `syncQueue` with realistic latency and toast notifications, requiring no third-party cloud keys (Supabase/Firebase).
  - **Emergency Caregiver Call:** Simulated cellular tele-call modal connecting Amma to Priya.

---

## 🌍 Global Dementia Community (New Feature)

SmritiCare features a dedicated, cloud-connected **Global Dementia Community** enabling patients, family caregivers, and healthcare professionals across India and worldwide to connect, share lived experiences, and support one another in a dignified, safe space.

### 🛡️ Critical Privacy & Architectural Separation
- **Local Dexie Database:** Private patient medical records, 30-day cognitive scores, medications, and PHC notes remain strictly confidential on the local device and are **NEVER uploaded or exposed** to the community.
- **Cloud Backend (Supabase):** Handles public community posts, comments, reactions, groups, 1-to-1 private messages, and moderation reports.
- **Zero GPS / Address Tracking:** For local discovery, only broad regional tags are used (e.g., *"Assam / North East"*, *"Delhi NCR"*, *"Central India"*). Exact street addresses and GPS coordinates are never collected or shown.
- **Dementia-Friendly Privacy Controls:** Users can disable local discovery, hide approximate location, restrict messages to connections only, or toggle online visibility with one tap.

### 👥 Multi-Level Discovery & Groups
- **Global:** Worldwide discussions & international peer support.
- **Country:** Communities tailored for India and global regions.
- **Regional:** Broad community circles like *North East Elders & Families*.
- **Language:** Dedicated groups for *Hindi*, *English*, and regional dialects.
- **Public & Private Groups:** Join open circles or request entry to private support groups like *Early Stage MCI Peer Circle*.

### ⚡ Realtime Messaging & Cross-Tab Broadcast Relay
- Full WebSocket realtime subscriptions via `@supabase/supabase-js`.
- Built-in multi-tab Realtime Event Bus (`BroadcastChannel`) ensures that instant post publishing, comments, reactions, and 1-to-1 messages update across tabs in real-time even during evaluation and testing without pre-configured API keys.

### 🗄️ Supabase Schema & Setup Instructions
To connect the community to your live Supabase cloud project:
1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL statements in `supabase_schema.sql` inside the Supabase SQL Editor to create all 14 tables, indexes, and Row Level Security (RLS) policies.
3. Copy your project credentials to `.env`:
   ```bash
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
4. Restart the development server (`npm run dev`).

---

## 🌐 Multilingual Accessibility

Header language switcher supports 4 key languages:
- **English**
- **हिन्दी (Hindi)**
- **অসমীয়া (Assamese)**
- **বাংলা (Bengali)**

---

*Built for Smart India Hackathon 2026 by Team AvishkarX.*

