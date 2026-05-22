# SoLaNail Content Repository

Source of truth for the SoLaNail website. Site is built from this repo into static HTML at `/var/www/solanail/`.

## Structure

- `live/` — last published state (drives the production site)
- `draft/` — Olga's unsaved edits (preview shows this)
- `media/` — photos and videos (after Pillow/ffmpeg processing)
- `templates/` — Jinja2 templates (only Sergey edits these)

## Workflow

1. Manager edits via admin panel → writes to `draft/`
2. Manager clicks "Опубликовать" → `cp draft/ → live/`, git commit + tag
3. Build script renders `live/` → `/var/www/solanail/`

## Rollback

Each publish creates a git tag `published-YYYY-MM-DD-HH-MM`. To roll back:

```bash
git checkout published-2026-05-21-15-12 -- live/
python /srv/solanail-build/build.py
```
