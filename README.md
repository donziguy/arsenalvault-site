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
- `src/styles/tailwind.css` and `tailwind.config.js` - Tailwind source, compiled to `/css/tailwind.css` during the Eleventy build.

## Analytics
GA4 `G-652RBNGMD2` and Google Ads `AW-18064652064` are set in `src/_data/site.js`. Every page loads gtag.js with that Ads id and configures both tags. Cross-domain linking covers `arsenalvault.com` and `app.arsenalvault.com`, so a Google click id on the marketing site can carry onto the app.

The Ads conversion action "AV Sign-up" uses send_to `AW-18064652064/xw8jCPOQ8aMdEKDu8qVD`. The app fires that conversion after a completed registration. This site does not send it on page views or register clicks, so the same signup is not counted twice.

## Commands
- `npm install` - Install dependencies.
- `npm run build` - Compile Tailwind, then generate `_site/`.
- `npm run serve` - Run a local Eleventy dev server.
- `npm run check` - Build and validate generated pages.

## Deploy
Push to `main` -> GitHub Actions builds `_site/` -> uploads the generated static output to Hostinger. `src/.htaccess` is copied into `_site/` (301 www → apex, clean URLs).

Requires `HOSTINGER_SSH_KEY` secret in repo settings.
