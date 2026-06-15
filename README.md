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

## Commands
- `npm install` - Install dependencies.
- `npm run build` - Generate `_site/`.
- `npm run serve` - Run a local Eleventy dev server.
- `npm run check` - Build and validate generated pages.

## Deploy
Push to `main` -> GitHub Actions builds `_site/` -> uploads the generated static output to Hostinger.

Requires `HOSTINGER_SSH_KEY` secret in repo settings.
