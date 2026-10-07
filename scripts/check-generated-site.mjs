import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

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

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Generated site check passed (${htmlFiles.length} HTML files).`);
