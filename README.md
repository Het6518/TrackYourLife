# TrackYourLife

A personal day-journaling app: log a daily mood score and note, see it on a year heatmap, share select days publicly, keep friends, pin goals to a vision board, and personalize the whole UI with a background effect, a custom photo, and an accent color. Includes a built-in music player.

Stack: **Django 5 + Django REST Framework** backend, **React 19 + Vite** frontend.

---

## Project structure

```
backend/
  config/        # Django project: settings, root urls, wsgi
  accounts/      # auth, profile, personalization (background/accent/effect)
  days/          # the core "Daymap" day-logging feature
  friends/       # friend requests / friendships
  visionboard/   # drag-and-drop goal pinboard
  music/         # user-uploaded song library
  manage.py
  requirements.txt
  media/         # uploaded avatars, songs, backgrounds (dev)

frontend/
  src/
    api/         # client.js — single fetch wrapper + per-feature API objects
    pages/       # one component per route (Dashboard, Explore, Map, Friends, VisionBoard, PublicProfile, Auth)
    components/  # Shell (top bar), MusicPlayer, ThemeSettings, WeatherFX, day cards, charts, etc.
    utils/       # date, export, geolocation, weather/theme, youtube
    assets/      # world-110m.json (offline map topology)
  package.json
```

---

## Features & the APIs/libraries behind them

### Daymap (core feature) — `backend/days/`, `frontend/src/pages/DashboardPage.jsx`
Log one entry per date: a score (1–10), a note, and a visibility level (`private` / `friends` / `public`). Entries render on a year heatmap, trend charts, and streak/average stats. Pure CRUD via DRF (`/api/days/`) — no external API.

### Explore & public profiles — `backend/days/views.py`, `ExplorePage.jsx`, `PublicProfilePage.jsx`
Lists users who have at least one public day (`GET /api/public/users/`) and a given user's visible days (`GET /api/public/users/<username>/days/`), filtered server-side by visibility and friendship status.

### Friends — `backend/friends/`, `FriendsPage.jsx`
Send/accept/decline friend requests, unfriend, and search users by username. Fully self-contained (`/api/friends/...`), no external service.

### Vision board — `backend/visionboard/`, `VisionBoardPage.jsx`
A drag-and-drop corkboard of "goal pins" — sticky notes or photos — with free-form position/rotation, done/undone state, and a choice of board background color. Backed by `/api/goals/`.

### Map — `frontend/src/pages/MapPage.jsx`
Renders a **fully offline world map**: real country outlines from a bundled Natural Earth 110m TopoJSON (`src/assets/world-110m.json`), projected and drawn with **d3-geo** + **topojson-client** as SVG paths. No tile server, no map API key, no runtime network call for the map itself.

User avatars are pinned on the map from stored coordinates. **Location sharing is opt-in**: nothing is captured automatically on login. On the Map tab, a user with no stored location sees a "Share my location" button; tapping it asks the browser's Geolocation API for coordinates once and saves them via `PUT /api/auth/me/location/`. Declining or ignoring the prompt has no effect on the rest of the app.

### Music player — `frontend/src/components/MusicPlayer.jsx`, `backend/music/`
Two independent sources, both reachable from the same player:
- **Your library**: upload your own audio files (+ optional cover art) to your account; stored via Django (`Song` model, `FileField`) and served from `/api/songs/`. Playback uses a plain HTML `<audio>` element.
- **Find a song**: search and play real tracks from YouTube, using the **YouTube Data API v3** for search and the **YouTube IFrame Player API** for playback — entirely client-side (`frontend/src/utils/youtube.js`). This requires a free Google Cloud API key (see [Environment variables](#environment-variables) below); without one, uploads still work but the search tab shows a setup hint instead.

### Personalization — `frontend/src/utils/weather.js`, `ThemeSettings.jsx`, `WeatherFX.jsx`
Everything here is **user-picked**, not automatic — there's no live weather/location API involved.
- **Background effect** — pick one of 5 options: *None*, *Winter* (falling snow), *Summer* (rising sun motes), *Rain*, *Cherry Blossom* (drifting petals). Each pairs a background photo with a canvas-based particle animation (pure `<canvas>` 2D, no assets or APIs beyond the bundled images) and shifts the UI's accent hue to match.
- **Background photo** — upload your own image to override the effect's photo everywhere.
- **Accent color** — pick a preset or a custom hex color to override the effect's accent hue everywhere.

All three are stored per-user (`Profile.theme_effect`, `theme_background`, `theme_accent_color`) and applied together on load, with your own picks always taking priority over the effect's defaults.

### Auth — `backend/accounts/`
DRF **TokenAuthentication** (`rest_framework.authtoken`). Register/login issue a token; the frontend sends it as `Authorization: Token <token>` on every request (`frontend/src/api/client.js`). Endpoints: `register`, `login`, `logout`, `me`, `avatar` (upload/remove), `location`, `board-style`, `theme-background` (upload/remove), `theme-accent`, `theme-effect` — all under `/api/auth/`.

---

## Tech stack

**Backend**
- Django `>=5.0,<6.0`
- Django REST Framework `>=3.15`
- django-cors-headers `>=4.3`
- Pillow `>=10.0` (image handling)
- psycopg2-binary `>=2.9` (optional — only needed if you point it at Postgres)
- gunicorn `>=22.0` / whitenoise `>=6.6` (production serving)

**Frontend**
- React `^19.3.0`, Vite `^8.3.0`
- d3-geo `^3.1.1`, topojson-client `^3.1.0` (offline world map)
- lucide-react (icons)
- No routing library — navigation is a small hand-rolled `navigate(page)` + `window.history.pushState` setup in `main.jsx`.

---

## Setup

### Backend
```bash
cd backend
python -m venv venv
./venv/Scripts/activate   # or source venv/bin/activate on macOS/Linux
pip install -r requirements.txt
cp .env.example .env      # fill in values, see below
python manage.py migrate
python manage.py runserver
```

By default (no Postgres env vars set) it uses a local `db.sqlite3` — nothing else to configure for local development.

### Frontend
```bash
cd frontend
npm install
cp .env.example .env      # optional, see below
npm run dev
```

### Environment variables

**`backend/.env`**
| Variable | Purpose | Required |
|---|---|---|
| `DJANGO_SECRET_KEY` | Django secret key | Only in production (`DEBUG=False`) — dev has an insecure default |
| `DJANGO_DEBUG` | `True`/`False` | No (defaults on) |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated hostnames | Production only |
| `DJANGO_CORS_ORIGINS` | Comma-separated origins allowed to call the API (also used as `CSRF_TRUSTED_ORIGINS`) | Defaults to `localhost:5173` / `127.0.0.1:5173` |
| `DJANGO_SSL_REDIRECT` | `True`/`False` | No |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT` | Use Postgres instead of SQLite | No |

**`frontend/.env`**
| Variable | Purpose | Required |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | No — defaults to `http://127.0.0.1:8000/api` |
| `VITE_YOUTUBE_API_KEY` | Enables "Find a song" YouTube search in the music player | No — app works without it, that tab just shows a setup hint |

Uploaded media (avatars, songs, background photos, vision-board images) is stored on the local filesystem under `backend/media/` in this setup — no cloud storage is configured.
