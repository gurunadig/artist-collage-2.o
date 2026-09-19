# Artist Collage

The professional home for independent artists.

This repository contains the directory, profiles, OTP auth, track previews, and music checkout.

```
api/   Django + DRF + PostgreSQL
web/   Next.js public site
```

## Run locally

**Database**

```bash
cd api
docker compose up -d
```

**API** — http://localhost:8000

```bash
cd api
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_artists
python manage.py runserver
```

Admin: http://localhost:8000/admin/ — `admin@artistcollage.com` / `admin12345`  
Dev OTP: `123456`

**Web** — http://localhost:3000

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Product brief: [api/docs/product.md](api/docs/product.md)
