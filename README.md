# TrackYourLife

A daily life-rating journal. Each day you log a score from 1–10 and an optional note, then review your history through a year heatmap, trend charts and a recent-entries list. Entries can be kept private or made public, and other people's public journals can be browsed on an Explore page.

## Tech stack

- **Backend:** Django + Django REST Framework, token authentication, django-cors-headers
- **Database:** SQLite by default, PostgreSQL when `POSTGRES_DB` is set
- **Frontend:** React (Vite), lucide-react icons

## Features

- Register, log in and log out (token auth)
- One entry per user per day (score 1–10, note, public/private flag)
- Dashboard with entry form, year heatmap, trends and recent entries
- Day modal to view, edit or delete an entry
- Explore page listing users with public entries, plus public profile pages

## Project structure

```
backend/
  config/     Django settings and root URLs
  accounts/   register / login / logout / me
  days/       Day model, API, admin, seed_demo command
frontend/
  src/
    api/         API client
    components/  AppHeader, DayModal, EntryForm, PublicUserCard,
                 RecentEntries, Trends, YearHeatmap
    pages/       Auth, Dashboard, Explore, PublicProfile
    utils/       Date helpers
```

## Getting started

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo     # optional demo data
python manage.py runserver
```

The API runs at http://127.0.0.1:8000/api. `psycopg2-binary` in `requirements.txt` is only used with PostgreSQL.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (http://127.0.0.1:5173 by default). The API base URL defaults to `http://127.0.0.1:8000/api`; override it with `VITE_API_URL` (see `frontend/.env.example`).

## Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `DJANGO_SECRET_KEY` | Required when `DJANGO_DEBUG` is not `True` | insecure dev key |
| `DJANGO_DEBUG` | Debug mode | `True` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated allowed hosts | `localhost,127.0.0.1,testserver` |
| `POSTGRES_DB` | Enables PostgreSQL when set | unset (SQLite) |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | empty |
| `POSTGRES_HOST` | Database host | `localhost` |
| `POSTGRES_PORT` | Database port | `5432` |

## Demo data

`python manage.py seed_demo [--days N]` creates demo users with generated entries (default 120 days each). Demo accounts use the password `demo12345`, for example the user `shah`.

## API

Authenticated requests send `Authorization: Token <token>`.

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register/` | Create an account |
| POST | `/api/auth/login/` | Log in, returns a token |
| POST | `/api/auth/logout/` | Log out |
| GET | `/api/auth/me/` | Current user |
| GET, POST | `/api/days/` | List or create your entries |
| PUT, DELETE | `/api/days/<id>/` | Update or delete an entry |
| GET | `/api/public/users/` | Users with public entries |
| GET | `/api/public/users/<username>/days/` | A user's public entries |

## Tests

```bash
cd backend
python manage.py test
```
