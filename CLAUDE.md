# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IGotIt is a full-stack English learning platform that uses YouTube videos with interactive subtitles for language learning. Users can click on any word in subtitles to get AI-powered translations while watching videos.

**Project Structure**: Monorepo using pnpm workspaces

## Development Commands

### From Root (using pnpm)
```bash
# Install all dependencies
pnpm install

# Start frontend dev server
pnpm dev

# Build frontend
pnpm build

# Start backend server
pnpm start:backend
pnpm dev:backend
```

### Individual Package Commands

**Frontend** (`packages/frontend/`):
```bash
cd packages/frontend
pnpm dev        # Start Vite dev server (port 5173)
pnpm build      # Build for production
pnpm preview    # Preview production build locally
```

**Backend** (`packages/backend/`):
```bash
cd packages/backend
pnpm dev        # Start Express server
pnpm start      # Start production server (port 3000)
```

### Python Subtitle Extraction
```bash
python3 packages/backend/get_subtitles.py 'VIDEO_URL'
```
The script outputs JSON to stdout with VTT-parsed subtitle data including text, start, and duration for each word.

## Architecture

### Monorepo Structure
- **Root**: Contains pnpm workspace configuration
- **packages/frontend/**: React 18 SPA (Vite-based) handling video playback UI
- **packages/backend/**: Express API server for subtitle extraction and translation

### Key Components

**Frontend Core** (`packages/frontend/`):
- `src/App.jsx` - Main container managing video state, subtitle data, and translations
- `src/components/VideoPlayer.jsx` - YouTube IFrame API wrapper
- `src/components/SubtitlePanel.jsx` - Renders clickable subtitle words synced with video
- `src/components/SubtitleWord.jsx` - Individual word component with translation display
- `src/hooks/useVideoPlayer.js` - Custom hook encapsulating YouTube API interactions

**Backend Core** (`packages/backend/server.js`):
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

**Backend** (`packages/backend/server.js`):
- `subtitleCache` - Map caching raw subtitle extraction results by video ID
- `translationCache` - Map caching sentence translations with cache key combining sentence + hash
- Stop words filtered inline without caching (a/the/is/are/etc.)

**Frontend** (`packages/frontend/src/App.jsx`):
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
- Primary: Zhipu AI (GLM-4-Flash-250414) - requires API key in `packages/backend/.env`
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
cd packages/backend
pnpm install
```

Create `.env` file (see `packages/backend/.env.example`):
```
ZHIPU_API_KEY=your_key_here
```

**Python dependencies** (via venv):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install yt-dlp
```

## Deployment

### Zeabur Multi-Service Deployment

The project is configured for Zeabur deployment as separate frontend and backend services:

1. **Frontend** (`packages/frontend/`): Static site deployment using Caddy
   - Build output: `dist/`
   - Configured via `zbpack.json`

2. **Backend** (`packages/backend/`): Docker container deployment
   - Uses `Dockerfile` to build container with Node.js + Python
   - Exposes port 3000
   - Configured via `zbpack.json`

Zeabur will automatically detect the pnpm workspace and deploy both packages as separate services.

## Known Constraints

- No database - uses in-memory caching (suitable for single-user development)
- No testing framework - tests not implemented
- No TypeScript - plain JavaScript with React
- No linting/formatting config - uses Vite defaults
- Chinese-first interface targeting Chinese speakers learning English
