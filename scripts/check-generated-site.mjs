import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.join(process.cwd(), "_site");
const requiredFiles = [
  "index.html",
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
}

const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
for (const file of requiredFiles.filter((file) => file.endsWith(".html"))) {
  const url = file === "index.html"
    ? "https://arsenalvault.com/"
    : file === "blog/index.html"
      ? "https://arsenalvault.com/blog/"
      : `https://arsenalvault.com/${file}`;
  if (!sitemap.includes(url)) failures.push(`sitemap.xml: missing ${url}`);
}

const htaccess = await readFile(path.join(root, ".htaccess"), "utf8");
if (!htaccess.includes("RewriteRule ^pricing/?$ /pricing.html")) {
  failures.push(".htaccess: missing /pricing → /pricing.html canonical redirect");
}

const pricingHtml = await readFile(path.join(root, "pricing.html"), "utf8");
if (!pricingHtml.includes('rel="canonical" href="https://arsenalvault.com/pricing.html"')) {
  failures.push("pricing.html: missing canonical tag for /pricing.html");
}

const blogRoot = path.join(root, "blog");
const blogHtmlFiles = (await walk(blogRoot)).filter((file) => file.endsWith(".html"));
for (const file of blogHtmlFiles) {
  const rel = path.relative(root, file);
  const html = await readFile(file, "utf8");
  if (html.includes("Download Free Trial")) failures.push(`${rel}: Cloud/blog CTA still says Download Free Trial`);
  if (/free forever options/i.test(html)) failures.push(`${rel}: vague "free forever options" copy`);
}

const checklistPosts = [
  "blog/insurance-documentation.html",
  "blog/stolen-firearm-checklist.html",
  "blog/spreadsheets-vs-apps.html",
  "blog/photographing-your-collection.html"
];
for (const file of checklistPosts) {
  const html = await readFile(path.join(root, file), "utf8");
  if (!html.includes('href="/checklist/')) failures.push(`${file}: missing /checklist/ internal link`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Generated site check passed (${htmlFiles.length} HTML files).`);
