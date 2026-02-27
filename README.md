# Arsenal Vault — Marketing Site

Static marketing site for [arsenalvault.com](https://arsenalvault.com).

Auto-deploys to Hostinger on every push to `main`.

## Files
- `*.html` — Marketing pages (home, features, pricing, support, upgrade, download)
- `static/img/` — Brand assets and images
- `.htaccess` — Apache redirects/config

## Deploy
Push to `main` → GitHub Actions → SSH deploy to Hostinger webroot.

Requires `HOSTINGER_SSH_KEY` secret in repo settings.
<!-- deployed Fri Feb 27 02:33:53 AM UTC 2026 -->
