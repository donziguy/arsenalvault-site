# Arsenal Vault — Marketing Site Rebuild

Drop-in replacement for the `arsenalvault-site` repo. Same stack (Tailwind CDN +
Bootstrap Icons), same file paths, same deploy. Push to `main` → existing
GitHub Action → Hostinger. Sitemap, blog/, legal, checklist, and assets are
untouched and carried over.

## Pages rebuilt
index · pricing · features · security · about · download · support

## What changed (conversion)
- **Moat leads.** Hero is "Your collection, in a vault only you can open" — the
  per-owner encryption story is first, not third. Signature element: the
  **data plate** (security spec rendered like a firearm's engraved plate).
- **Founder story surfaced** from About onto the homepage (the stolen-collection
  origin) — strongest trust asset, was buried.
- **Pricing comparison table fixed** — real check icons WITH an SVG fallback
  that auto-activates if the Bootstrap Icons font fails to load, so checks can
  never silently vanish.
- **One CTA destination** — every primary CTA → app.arsenalvault.com/register
  with per-placement UTMs (the old desktop-vs-mobile split is gone).
- **Risk-reversal above the fold** + the 30-day money-back guarantee surfaced
  from Support onto Pricing.
- **Desktop funnel connected** — download page now presents both Cloud and
  Windows desktop (was cloud-only dead end); desktop pricing tiers shown.

## Stale copy CORRECTED (was live)
- Support FAQ said "planning to launch in 2026" → removed (site says Now Available).
- Support FAQ promised **PayPal** → corrected to Stripe (matches app + pricing).
- Removed "military-grade / unbreakable" claims → replaced with real specifics
  (SQLCipher, Fernet, envelope-wrapped 256-bit key, TLS 1.3).
- Single canonical gold (#D4AF37); the #D4A400 fork does not appear.

## Before you deploy — 3 checks
1. **Tailwind CDN is the dev build.** Fine to ship, but precompile Tailwind to a
   static CSS file in the deploy workflow for faster first paint (the dev CDN
   ships the whole compiler to every visitor).
2. **Confirm desktop checkout flow.** Desktop pricing CTAs currently route to
   /register. If desktop sells via /download or a Stripe link, update those
   hrefs (noted inline in pricing.html).
3. **Verify limits match the app.** Displayed plan limits (10/20/unlimited) must
   match get_plan_limits() in app.py. If you adopt the pricing change discussed
   separately, update both together.

## Not yet done (optional follow-ups)
- Social proof (user count / testimonials) — no real numbers to display yet.
- The unused screenshots in img/screenshots/ (accessories, activity-log,
  add-firearm, firearms-list, menu-nav, settings) could feed a features gallery.

---

## Round 2 fixes (post-review)

Addressed feedback from review pass:

1. **Mobile pricing polish — FIXED.** The guarantee row now wraps cleanly
   (flex-wrap, items as discrete non-breaking chips with proper gap) instead
   of jamming together on narrow screens. Root cause of the "cramped cards":
   several spacing classes (px-4.5, p-7.5, gap-4.5, gap-13, etc.) are NOT valid
   Tailwind steps and silently rendered as ZERO padding/gap on the CDN build.
   All invalid spacing utilities across all 8 pages were remapped to the
   nearest real step (px-5, p-8, gap-4, gap-12). Cards and rows now space
   correctly.

2. **.htaccess + .github/ — RESTORED (was the real bug).** These dotfiles were
   dropped from the earlier zip because `cp *` skips dotfiles. Both are back.
   Bonus: .htaccess line 1 is `Options -Indexes`, which is the fix for the
   directory-listing page you saw locally — once deployed, Hostinger serves
   index.html instead of listing the folder. It also enables extensionless
   URLs (/pricing -> pricing.html).

## Still requires YOUR confirmation before go-live (cannot verify from here)

- **Tailwind CDN (all 8 pages).** Still on cdn.tailwindcss.com (dev build).
  Fine to ship for now; precompile to static CSS in the deploy workflow for
  production speed. Lower priority than the above.
- **Desktop pricing CTAs route to /register** (UTMs desktop_basic/pro/ultimate).
  Confirm that's the correct Windows desktop purchase flow. If desktop sells via
  a Stripe link or /download, update those 3 hrefs in pricing.html.
- **Verify displayed limits/prices match the app.** Cloud 10/20/unlimited and
  $4.99/$9.99/$19.99; desktop $44.99/$89.99/$179.99. These must match
  get_plan_limits() and your Stripe prices before launch. If you adopt the
  pricing restructure discussed in chat, update site + app together.
