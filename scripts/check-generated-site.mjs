import { createRequire } from "node:module";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const nunjucks = require("nunjucks");
const pricing = require("../src/_data/pricing.js");

const root = path.join(process.cwd(), "_site");
const requiredFiles = [
  "index.html",
  "start.html",
  "features.html",
  "pricing.html",
  "download.html",
  "support.html",
  "contact.html",
  "legal.html",
  "blog/index.html",
  "sitemap.xml",
  "feed.xml"
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

for (const file of requiredFiles) {
  await stat(path.join(root, file));
}

const htmlFiles = (await walk(root)).filter((file) => file.endsWith(".html"));
const failures = [];

for (const file of htmlFiles) {
  const rel = path.relative(root, file);
  const html = await readFile(file, "utf8");
  if (rel !== "start.html" && !html.includes('href="/contact.html"')) failures.push(`${rel}: missing Contact link`);
  if (html.includes("support@arsenalvault.com")) failures.push(`${rel}: exposes support email`);
  if (html.includes("mailto:")) failures.push(`${rel}: contains mailto link`);
  if (!/href="https:\/\/app\.arsenalvault\.com\/register(?:\?[^"]*)?"/.test(html)) failures.push(`${rel}: missing register CTA`);
  if (!html.includes("analytics.arsenalvault.com/script.js")) failures.push(`${rel}: missing analytics`);
  const hubspotLoaders = html.split("hs-script-loader").length - 1;
  if (hubspotLoaders !== 1) failures.push(`${rel}: expected one HubSpot loader, found ${hubspotLoaders}`);
  if (!html.includes("js.hs-scripts.com/245057554.js")) failures.push(`${rel}: missing HubSpot portal script`);
  if (/<script[^>]+src=["'][^"']*js\.hs-scripts\.com\/245057554\.js["']/.test(html)) {
    failures.push(`${rel}: HubSpot loader is not deferred until page load`);
  }
  if (!html.includes("window.addEventListener('load'")) failures.push(`${rel}: HubSpot loader does not wait for page load`);
  if (html.includes("cdn.tailwindcss.com")) failures.push(`${rel}: still loads Tailwind from the CDN`);
  if (!html.includes('href="/css/tailwind.css"')) failures.push(`${rel}: missing compiled Tailwind stylesheet`);
  for (const tag of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\swidth="\d+"/.test(tag[0]) || !/\sheight="\d+"/.test(tag[0])) {
      failures.push(`${rel}: image missing width or height (${tag[0].slice(0, 140)})`);
    }
  }
  if (!html.includes("https://www.googletagmanager.com/gtag/js?id=G-652RBNGMD2")) {
    failures.push(`${rel}: missing GA4 gtag loader`);
  }
  if (!html.includes('"ga4Id":"G-652RBNGMD2"') && !html.includes('"ga4Id": "G-652RBNGMD2"')) {
    failures.push(`${rel}: missing GA4 measurement id in tracking config`);
  }
  if (!html.includes('"linkerDomains":["arsenalvault.com","app.arsenalvault.com"]') && !html.includes('"linkerDomains": ["arsenalvault.com", "app.arsenalvault.com"]')) {
    failures.push(`${rel}: missing cross-domain linker domains`);
  }
  if (!html.includes("gtag('config', tracking.googleAdsId")) failures.push(`${rel}: missing Google Ads config`);
  if (!html.includes("send_to: tracking.googleAdsId + '/' + tracking.googleAdsConversionLabel")) {
    failures.push(`${rel}: missing register-click conversion`);
  }
  if (!html.includes("transport_type: 'beacon'")) failures.push(`${rel}: conversion is not sent with beacon transport`);
}

const tailwindCss = await readFile(path.join(root, "css/tailwind.css"), "utf8");
if (tailwindCss.length < 10000) failures.push("css/tailwind.css is unexpectedly small");
if (!tailwindCss.includes(".text-av-gold")) failures.push("css/tailwind.css is missing av-gold utilities");
if (!tailwindCss.includes(".font-display")) failures.push("css/tailwind.css is missing the display font");

function pngSize(buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}
const logoPath = path.join(process.cwd(), "static/img/av-shield-small.png");
const ogPath = path.join(process.cwd(), "img/av-shield-512.png");
const logoStat = await stat(logoPath);
const ogStat = await stat(ogPath);
const logoSize = pngSize(await readFile(logoPath));
const ogSize = pngSize(await readFile(ogPath));
if (logoStat.size > 8 * 1024) failures.push(`av-shield-small.png is ${logoStat.size} bytes, expected about 5 KB`);
if (logoSize.width !== 96 || logoSize.height !== 144) failures.push(`av-shield-small.png is ${logoSize.width}x${logoSize.height}, expected 96x144`);
if (ogStat.size > 90 * 1024) failures.push(`av-shield-512.png is ${ogStat.size} bytes`);
if (ogSize.width !== 512 || ogSize.height !== 512) failures.push("av-shield-512.png is no longer 512x512");

const startPage = await readFile(path.join(root, "start.html"), "utf8");
const startPrimary = "https://app.arsenalvault.com/register?utm_source=google&utm_medium=cpc&utm_campaign=av_gads_soft_v1&utm_content=start_primary";
const startSecondary = "https://arsenalvault.com/claim-prep-checklist.html?utm_source=google&utm_medium=cpc&utm_campaign=av_gads_soft_v1&utm_content=start_secondary";
if (!startPage.includes(startPrimary)) failures.push("start.html: missing av_gads_soft_v1 primary register CTA");
if (!startPage.includes(startSecondary)) failures.push("start.html: missing av_gads_soft_v1 claim-prep checklist CTA");
if (!startPage.includes('rel="canonical" href="https://arsenalvault.com/start"')) failures.push("start.html: canonical is not /start");
if (/free trial/i.test(startPage)) failures.push("start.html: says free trial");
if (startPage.includes("screenshots/")) failures.push("start.html: includes product screenshots");
if (startPage.includes("utm_medium=nav_cta") || startPage.includes("utm_medium=mobile_nav_cta") || startPage.includes("utm_campaign=free_account")) {
  failures.push("start.html: nav CTA still overwrites campaign tags");
}
const startAnchors = [...startPage.matchAll(/<a\b[^>]*href="([^"]+)"/gi)].map((match) => match[1]);
const allowedStartHrefs = new Set([
  "/start",
  startPrimary,
  startSecondary
]);
for (const href of startAnchors) {
  if (!allowedStartHrefs.has(href)) failures.push(`start.html: unexpected link ${href}`);
}
const primaryCount = startAnchors.filter((href) => href === startPrimary).length;
const secondaryCount = startAnchors.filter((href) => href === startSecondary).length;
if (primaryCount < 3) failures.push(`start.html: expected nav, hero, and bottom primary CTAs, found ${primaryCount}`);
if (secondaryCount !== 1) failures.push(`start.html: expected one secondary CTA, found ${secondaryCount}`);
if (!startPage.includes('href="/start"')) failures.push("start.html: logo does not stay on /start");
for (const leak of ["/features.html", "/pricing.html", "/blog/", "/about.html", "/support.html", "/contact.html", "/download.html", "/security.html", "/legal.html"]) {
  if (startPage.includes(`href="${leak}`)) failures.push(`start.html: still links to ${leak}`);
}

const htaccess = await readFile(path.join(root, ".htaccess"), "utf8");
const requiredRedirects = [
  ["www-to-apex", "RewriteRule ^(.*)$ https://arsenalvault.com/$1 [R=301,L,QSA]"],
  ["start.html", "RewriteRule ^start\\.html$ /start [R=301,L,QSA]"],
  ["jasper-partial-", "RewriteRule ^blog/jasper-partial-$ /blog/jasper-partial-recovery-serial-inventory.html [R=301,L]"],
  ["upgrade.html", "RewriteRule ^upgrade\\.html$ /pricing.html [R=301,L]"],
  ["upgrade", "RewriteRule ^upgrade$ /pricing.html [R=301,L]"],
  ["blog checklist", "RewriteRule ^blog/firearm-inventory-checklist\\.html$ /checklist/ [R=301,L]"],
  ["static checklist", "RewriteRule ^static/firearm-inventory-checklist\\.html$ /checklist/ [R=301,L]"],
  ["cost article", "RewriteRule ^blog/how-much-does-firearm-inventory-software-cost\\.html$ /pricing.html [R=301,L]"],
  ["encrypted vault", "RewriteRule ^blog/why-your-firearms-inventory-needs-an-encrypted-vault\\.html$ /security.html [R=301,L]"],
  ["legal-new", "RewriteRule ^legal-new\\.html$ /legal.html [R=301,L]"]
];
for (const [name, rule] of requiredRedirects) {
  if (!htaccess.includes(rule)) failures.push(`.htaccess: missing ${name} redirect`);
}
const wwwRuleAt = htaccess.indexOf("RewriteCond %{HTTP_HOST} ^www\\.arsenalvault\\.com$ [NC]");
const jasperRuleAt = htaccess.indexOf("RewriteRule ^blog/jasper-partial-$");
const cleanUrlRuleAt = htaccess.indexOf("RewriteRule ^(.+)$ $1.html [L,QSA]");
if (wwwRuleAt === -1 || jasperRuleAt === -1 || cleanUrlRuleAt === -1 || !(wwwRuleAt < jasperRuleAt && jasperRuleAt < cleanUrlRuleAt)) {
  failures.push(".htaccess: legacy redirects must stay after the www rule and before the clean-URL rewrite");
}

const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
const feed = await readFile(path.join(root, "feed.xml"), "utf8");
const blogIndex = await readFile(path.join(root, "blog/index.html"), "utf8");
const jasperPost = await readFile(path.join(root, "blog/jasper-partial-recovery-serial-inventory.html"), "utf8");
const fullJasperUrl = "https://arsenalvault.com/blog/jasper-partial-recovery-serial-inventory.html";
if (!sitemap.includes(`<loc>${fullJasperUrl}</loc>`)) failures.push("sitemap.xml: missing full Jasper post URL");
if (!feed.includes(`<link href="${fullJasperUrl}"/>`)) failures.push("feed.xml: missing full Jasper post URL");
if (!blogIndex.includes('href="/blog/jasper-partial-recovery-serial-inventory.html"')) {
  failures.push("blog/index.html: missing full Jasper post link");
}
if (!jasperPost.includes(`rel="canonical" href="${fullJasperUrl}"`)) failures.push("Jasper post: canonical is not the full slug");
if (!jasperPost.includes(`property="og:url" content="${fullJasperUrl}"`)) failures.push("Jasper post: og:url is not the full slug");
for (const [name, html] of [["sitemap.xml", sitemap], ["feed.xml", feed], ["blog/index.html", blogIndex], ["jasper post", jasperPost]]) {
  if (/jasper-partial-(?!recovery)/.test(html)) failures.push(`${name}: publishes truncated jasper-partial- URL`);
}
for (const file of requiredFiles.filter((file) => file.endsWith(".html"))) {
  const url = file === "index.html"
    ? "https://arsenalvault.com/"
    : file === "blog/index.html"
      ? "https://arsenalvault.com/blog/"
      : file === "start.html"
        ? "https://arsenalvault.com/start"
        : `https://arsenalvault.com/${file}`;
  if (!sitemap.includes(url)) failures.push(`sitemap.xml: missing ${url}`);
}

const founderPartial = await readFile(path.join(process.cwd(), "src/_includes/partials/founder-banner.njk"), "utf8");
if (!founderPartial.includes("pricing.showFounderBanner")) {
  failures.push("founder banner is not behind pricing.showFounderBanner");
}
const nunjucksEnv = nunjucks.configure(path.join(process.cwd(), "src/_includes"), { autoescape: true });
const founderOff = nunjucksEnv.render("partials/founder-banner.njk", {
  pricing: { ...pricing, showFounderBanner: false }
});
if (founderOff.trim()) failures.push("founder banner still renders when showFounderBanner is false");
const founderOn = nunjucksEnv.render("partials/founder-banner.njk", { pricing });
if (!founderOn.includes(pricing.founderUrl)) failures.push("founder banner is missing the app pricing link");
if (!founderOn.includes("Claim a founder spot")) failures.push("founder banner is missing the claim button");
if (!founderOn.includes(pricing.founderCloseDate)) failures.push("founder banner is missing the close date");
if (/—/.test(founderOn)) failures.push("founder banner contains an em dash");
if (/of 100 left|spots left|spots remaining|\d+ of 100/i.test(founderOn)) {
  failures.push("founder banner invents a live spots counter");
}

const pricingPage = await readFile(path.join(root, "pricing.html"), "utf8");
const homePage = await readFile(path.join(root, "index.html"), "utf8");
const downloadPage = await readFile(path.join(root, "download.html"), "utf8");
const pricingSurfaces = [
  ["pricing.html", pricingPage],
  ["index.html", homePage],
  ["download.html", downloadPage]
];

function requireText(file, html, text) {
  if (!html.includes(text)) failures.push(`${file}: missing ${text}`);
}

for (const [file, html] of pricingSurfaces) {
  if (/trial/i.test(html)) failures.push(`${file}: contains trial language`);
  if (/MOST POPULAR|Most popular/i.test(html)) failures.push(`${file}: still says Most popular`);
  if (html.includes("$36")) failures.push(`${file}: still shows the old $36 Private Vault price`);
}
if (pricingPage.includes("\u2014")) failures.push("pricing.html: contains an em dash");
if (downloadPage.includes("\u2014")) failures.push("download.html: contains an em dash");

requireText("pricing.html", pricingPage, "Free forever for up to 5 firearms");
requireText("pricing.html", pricingPage, "Best for insurance");
requireText("pricing.html", pricingPage, "Unlimited firearms");
requireText("pricing.html", pricingPage, "2 months free");
requireText("pricing.html", pricingPage, "save 20%");
requireText("pricing.html", pricingPage, pricing.yearlySavingsLabel);
requireText("pricing.html", pricingPage, "Annual license, renews yearly");
requireText("pricing.html", pricingPage, "data-billing=\"monthly\"");
requireText("pricing.html", pricingPage, "data-billing=\"yearly\"");
requireText("pricing.html", pricingPage, `$${pricing.basic.monthly}`);
requireText("pricing.html", pricingPage, `$${pricing.basic.yearly}`);
requireText("pricing.html", pricingPage, `$${pricing.pro.monthly}`);
requireText("pricing.html", pricingPage, `$${pricing.pro.yearly}`);
requireText("pricing.html", pricingPage, `$${pricing.ultimate.monthly}`);
requireText("pricing.html", pricingPage, `$${pricing.ultimate.yearly}`);
requireText("pricing.html", pricingPage, `$${pricing.privateVault.monthly}`);
requireText("pricing.html", pricingPage, `$${pricing.privateVault.yearly}`);
requireText("pricing.html", pricingPage, "Up to 10");
if (pricingPage.includes("10+")) failures.push("pricing.html: still says 10+ members");

if (pricing.showFounderBanner) {
  requireText("pricing.html", pricingPage, "id=\"founder-lifetime\"");
  requireText("pricing.html", pricingPage, pricing.founderUrl);
  requireText("pricing.html", pricingPage, `$${pricing.founderPrice}`);
  requireText("pricing.html", pricingPage, "What is Founder Lifetime?");
  requireText("pricing.html", pricingPage, pricing.founderCloseDate);
} else if (pricingPage.includes("id=\"founder-lifetime\"") || pricingPage.includes("Claim a founder spot")) {
  failures.push("pricing.html: founder banner is present while showFounderBanner is false");
}
if (/of 100 left|spots left|spots remaining/i.test(pricingPage)) {
  failures.push("pricing.html: invents a live spots counter");
}

const jsonLdBlocks = [...pricingPage.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
if (jsonLdBlocks.length < 2) failures.push("pricing.html: expected product and FAQ JSON-LD");
for (const block of jsonLdBlocks) {
  try {
    const data = JSON.parse(block[1]);
    const encoded = JSON.stringify(data);
    for (const amount of [
      pricing.basic.monthly,
      pricing.basic.yearly,
      pricing.pro.monthly,
      pricing.pro.yearly,
      pricing.ultimate.monthly,
      pricing.ultimate.yearly,
      pricing.privateVault.monthly,
      pricing.privateVault.yearly
    ]) {
      if (data["@type"] === "WebPage" && !encoded.includes(`"${amount}"`)) {
        failures.push(`pricing.html JSON-LD missing price ${amount}`);
      }
    }
    if (data["@type"] === "WebPage" && pricing.showFounderBanner && !encoded.includes(`"${pricing.founderPrice}"`)) {
      failures.push("pricing.html JSON-LD missing founder price");
    }
    if (data["@type"] === "FAQPage" && !encoded.includes("Free forever for up to 5 firearms")) {
      failures.push("pricing.html FAQ JSON-LD missing free-plan wording");
    }
  } catch (error) {
    failures.push(`pricing.html JSON-LD did not parse: ${error.message}`);
  }
}

requireText("index.html", homePage, "Best for insurance");
requireText("index.html", homePage, `$${pricing.basic.yearly}`);
requireText("index.html", homePage, `$${pricing.pro.yearly}`);
requireText("index.html", homePage, `$${pricing.ultimate.yearly}`);
requireText("index.html", homePage, "data-billing=\"yearly\"");
const homeJson = homePage.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!homeJson) {
  failures.push("index.html: missing JSON-LD");
} else {
  try {
    const data = JSON.parse(homeJson[1]);
    const encoded = JSON.stringify(data);
    for (const amount of ["0", pricing.basic.monthly, pricing.basic.yearly, pricing.pro.yearly, pricing.ultimate.yearly]) {
      if (!encoded.includes(`"${amount}"`)) failures.push(`index.html JSON-LD missing price ${amount}`);
    }
  } catch (error) {
    failures.push(`index.html JSON-LD did not parse: ${error.message}`);
  }
}

const supportPage = await readFile(path.join(root, "support.html"), "utf8");
const securityPage = await readFile(path.join(root, "security.html"), "utf8");
if (supportPage.includes("$36") || securityPage.includes("$36")) {
  failures.push("support or security still shows the old $36 Private Vault price");
}
requireText("support.html", supportPage, `$${pricing.privateVault.yearly}/yr`);
requireText("download.html", downloadPage, "Annual license, renews yearly");

const claimPrep = await readFile(path.join(root, "claim-prep-checklist.html"), "utf8");
const claimThanks = await readFile(path.join(root, "claim-prep-checklist-thanks.html"), "utf8");
const robots = await readFile(path.join(root, "robots.txt"), "utf8");
const pdfHref = /href="[^"]*AV-firearm-insurance-claim-prep-checklist\.pdf"/;
if (pdfHref.test(claimPrep)) failures.push("claim-prep-checklist.html links the PDF before the email form");
if (pdfHref.test(claimThanks)) failures.push("claim-prep-checklist-thanks.html publishes a PDF href before the gate cookie");
if (!claimPrep.includes("av_claim_prep=1")) failures.push("claim-prep form does not set the gate cookie");
if (!claimPrep.includes("/submissions/v3/integration/submit/")) failures.push("claim-prep form does not post to the HubSpot capture");
if (!claimThanks.includes("TODO(Marketer)")) failures.push("claim-prep thanks page is missing TODO(Marketer) placeholder copy");
if (!claimThanks.includes("av_claim_prep=1")) failures.push("thanks page does not check the gate cookie");
if (!claimThanks.includes("link.href = '/static/AV-firearm-insurance-claim-prep-checklist.pdf'")) {
  failures.push("thanks page does not reveal the PDF after the gate cookie");
}
const pdfRule = "RewriteRule ^static/AV-firearm-insurance-claim-prep-checklist\\.pdf$ - [F,L]";
const pdfCond = "RewriteCond %{HTTP_COOKIE} !av_claim_prep=1";
if (!htaccess.includes(pdfRule) || !htaccess.includes(pdfCond)) failures.push(".htaccess: claim-prep PDF is not denied without the gate cookie");
if (!(htaccess.indexOf(pdfCond) < htaccess.indexOf(pdfRule) && htaccess.indexOf(pdfRule) < cleanUrlRuleAt)) {
  failures.push(".htaccess: claim-prep PDF rule must stay before the clean-URL rewrite");
}
if (!robots.includes("Disallow: /static/AV-firearm-insurance-claim-prep-checklist.pdf")) {
  failures.push("robots.txt: claim-prep PDF is not disallowed");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Generated site check passed (${htmlFiles.length} HTML files).`);
