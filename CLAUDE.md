# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IGotIt is a full-stack English learning platform that uses YouTube videos with interactive subtitles for language learning. Users can click on any word in subtitles to get AI-powered translations while watching videos.

## Development Commands

### Frontend (from root)
```bash
npm run dev        # Start Vite dev server (port 5173)
npm run build      # Build for production
npm run preview    # Preview production build locally
```

### Backend (from server directory)
```bash
cd server
npm run dev        # Start Express server with nodemon
npm start          # Start production server (port 3001)
```

### Python Subtitle Extraction
```bash
python3 get_subtitles.py 'VIDEO_URL'    # Extract subtitles from YouTube
```
The script outputs JSON to stdout with VTT-parsed subtitle data including text, start, and duration for each word.

## Architecture

### Two-Tier Structure
- **Frontend**: React 18 SPA (Vite-based) handling video playback UI
- **Backend**: Express API server serving as proxy for subtitle extraction and translation services

### Key Components

**Frontend Core**:
- `src/App.jsx` - Main container managing video state, subtitle data, and translations
- `src/components/VideoPlayer.jsx` - YouTube IFrame API wrapper
- `src/components/SubtitlePanel.jsx` - Renders clickable subtitle words synced with video
- `src/components/SubtitleWord.jsx` - Individual word component with translation display
- `src/hooks/useVideoPlayer.js` - Custom hook encapsulating YouTube API interactions

**Backend Core** (`server/server.js`):
- `POST /api/subtitles` - Spawns Python process to extract YouTube subtitles via yt-dlp
- `POST /api/translate` - Word translation with stop-word filtering
- `POST /api/translate-sentence` - Full sentence translation with LLM caching
- `POST /api/clear-cache` - Clears translation cache
- `GET /health` - Health check

### Data Flow

1. User enters YouTube URL → Frontend calls `/api/subtitles`
2. Server spawns `get_subtitles.py` → Uses yt-dlp to fetch VTT subtitles
3. Python parses VTT into word-level JSON with timings → Returns to frontend
4. Frontend displays words, syncs highlighting with YouTube player time
5. User clicks word → Frontend calls `/api/translate` or `/api/translate-sentence`
6. Server uses Zhipu AI (GLM-4-Flash) for translation → Returns with caching

### Caching Strategy

**Backend** (`server/server.js`):
- `subtitleCache` - Map caching raw subtitle extraction results by video ID
- `translationCache` - Map caching sentence translations with cache key combining sentence + hash
- Stop words filtered inline without caching (a/the/is/are/etc.)

**Frontend** (`src/App.jsx`):
- `visibleTranslations` state tracks which translations are currently displayed

## Important Implementation Details

### YouTube Integration
- Uses YouTube IFrame API (loaded asynchronously in `App.jsx`)
- Player instance stored in ref, controlled via `useVideoPlayer` hook
- Time updates every 100ms to sync subtitle highlighting

### Subtitle Processing
- Python script prioritizes English subtitles (en.*, en-US, en-GB variants)
- VTT parsing splits subtitles into words, calculating timings proportionally
- Words are reassembled into sentences at punctuation boundaries (。！？)

### Translation Service
- Primary: Zhipu AI (GLM-4-Flash-250414) - requires API key in `server/.env`
- Fallback: Google Translation API (currently commented out in code)
- Stop words list hardcoded in backend to filter common English words
- Batch translation with concurrency control (max 5 concurrent requests)

### State Management
- No Redux/Context API - all state in `App.jsx` component
- Key state: `subtitles`, `videoId`, `currentWordIndex`, `visibleTranslations`, `isVideoVisible`
- Video state managed by `useVideoPlayer` hook

## Environment Setup

**Frontend**: Standard Vite setup, no special configuration

**Backend** requires:
```bash
cd server
npm install
```

Create `.env` file (see `server/.env.example`):
```
ZHIPU_API_KEY=your_key_here
```

**Python dependencies** (via venv):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install yt-dlp
```

## Known Constraints

- No database - uses in-memory caching (suitable for single-user development)
- No testing framework - tests not implemented
- No TypeScript - plain JavaScript with React
- No linting/formatting config - uses Vite defaults
- Chinese-first interface targeting Chinese speakers learning English
