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

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Generated site check passed (${htmlFiles.length} HTML files).`);
