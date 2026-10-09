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
  if (!html.includes('href="/contact.html"')) failures.push(`${rel}: missing Contact link`);
  if (html.includes("support@arsenalvault.com")) failures.push(`${rel}: exposes support email`);
  if (html.includes("mailto:")) failures.push(`${rel}: contains mailto link`);
  if (!/href="https:\/\/app\.arsenalvault\.com\/register(?:\?[^"]*)?"/.test(html)) failures.push(`${rel}: missing register CTA`);
  if (!html.includes("analytics.arsenalvault.com/script.js")) failures.push(`${rel}: missing analytics`);
  const hubspotLoaders = html.split('id="hs-script-loader"').length - 1;
  if (hubspotLoaders !== 1) failures.push(`${rel}: expected one HubSpot loader, found ${hubspotLoaders}`);
  if (!html.includes("js.hs-scripts.com/245057554.js")) failures.push(`${rel}: missing HubSpot portal script`);
}

const startPage = await readFile(path.join(root, "start.html"), "utf8");
const startPrimary = "https://app.arsenalvault.com/register?utm_source=google&utm_medium=cpc&utm_campaign=av_gads_soft_v1&utm_content=start_primary";
const startSecondary = "https://arsenalvault.com/claim-prep-checklist.html?utm_source=google&utm_medium=cpc&utm_campaign=av_gads_soft_v1&utm_content=start_secondary";
if (!startPage.includes(startPrimary)) failures.push("start.html: missing av_gads_soft_v1 primary register CTA");
if (!startPage.includes(startSecondary)) failures.push("start.html: missing av_gads_soft_v1 claim-prep checklist CTA");
if (!startPage.includes('rel="canonical" href="https://arsenalvault.com/start"')) failures.push("start.html: canonical is not /start");
if (/free trial/i.test(startPage)) failures.push("start.html: says free trial");
if (startPage.includes("screenshots/")) failures.push("start.html: includes product screenshots");

const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
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

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Generated site check passed (${htmlFiles.length} HTML files).`);
