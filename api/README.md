# Artist Collage API

Django + Django REST Framework backend for Artist Collage. Milestone 2 covers OTP auth, the artist directory, public profiles, track uploads, and signed audio previews.

Not a social network. Not a streaming service.

## Stack

- Django 5.2 + DRF
- PostgreSQL 16
- JWT (SimpleJWT)
- OTP via a replaceable provider (`dev` locally, MSG91 later)
- Local disk media (Cloudflare R2 later)

## Local setup

```bash
docker compose up -d
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_artists
python manage.py runserver
```

- API: http://localhost:8000/api/v1/health
- Admin: http://localhost:8000/admin/ — `admin@artistcollage.com` / `admin12345`
- Dev OTP code: `123456`

## Milestone 1 endpoints

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/v1/auth/otp/request` | no |
| POST | `/api/v1/auth/otp/verify` | no |
| GET | `/api/v1/auth/me` | yes |
| GET | `/api/v1/lookups` | no |
| GET | `/api/v1/artists` | no |
| GET | `/api/v1/artists/:slug` | no |
| GET/PATCH | `/api/v1/me/profile` | yes |
| POST | `/api/v1/me/profile/image` | yes |
| GET/POST | `/api/v1/me/tracks` | yes |
| PATCH/DELETE | `/api/v1/me/tracks/:id` | yes |
| GET | `/api/v1/artists/:slug/tracks/:track` | no |
| GET | `/api/v1/artists/:slug/tracks/:track/preview` | signed URL |

Directory query params: `q`, `city`, `discipline`, `genre`, `language`, `availability` (`hire` \| `collab`), `verified`.

Example: `/api/v1/artists?q=Kannada%20rapper%20in%20Bangalore`
