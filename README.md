# Arsenal Vault - Marketing Site

Static marketing site for [arsenalvault.com](https://arsenalvault.com).

Built with Eleventy and deployed as static HTML to Hostinger on every push to `main`.

## Structure
- `src/*.njk` - Main marketing pages.
- `src/blog/*.njk` - Blog posts and blog index.
- `src/_includes/layouts/base.njk` - Shared page shell, metadata, analytics, styles, nav, and footer.
- `src/_includes/partials/nav.njk` - Sitewide navigation.
- `src/_includes/partials/footer.njk` - Sitewide footer.
- `src/sitemap.njk` - Generated sitemap.
- `src/feed.njk` - Generated Atom feed.
- `img/` and `static/` - Passthrough image assets.

## Analytics
GA4 `G-652RBNGMD2` is fixed in `src/_data/site.js`. The Google Ads tag id and conversion label are read at build time from `GOOGLE_ADS_ID` and `GOOGLE_ADS_CONVERSION_LABEL`. When those are unset, the build uses the placeholders `AW-XXXXXXXXXX` and `XXXXXXXXXX`. Set both as repository secrets before a production build so the deployed pages carry the real tag. The marketing site fires the Ads conversion on a click through to `app.arsenalvault.com/register`. A register-success conversion on the app is separate and is not configured here.

## Commands
- `npm install` - Install dependencies.
- `npm run build` - Generate `_site/`.
- `npm run serve` - Run a local Eleventy dev server.
- `npm run check` - Build and validate generated pages.

## Deploy
Push to `main` -> GitHub Actions builds `_site/` -> uploads the generated static output to Hostinger. `src/.htaccess` is copied into `_site/` (301 www → apex, clean URLs).

Requires `HOSTINGER_SSH_KEY` secret in repo settings.
