import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = path.join(root, "src");
const passthroughDirs = ["img", "static"];
const passthroughFiles = [".htaccess", "robots.txt"];
const htmlFiles = [
  "index.html",
  "features.html",
  "pricing.html",
  "download.html",
  "support.html",
  "contact.html",
  "about.html",
  "legal.html",
  "support/windows-install.html",
  "blog/ammo-inventory-management.html",
  "blog/desktop-vs-cloud.html",
  "blog/estate-planning-firearms.html",
  "blog/getting-started.html",
  "blog/import-from-spreadsheet.html",
  "blog/insurance-documentation.html",
  "blog/photographing-your-collection.html",
  "blog/range-day-prep.html",
  "blog/reloading-tracker-setup.html",
  "blog/spreadsheets-vs-apps.html",
  "blog/stolen-firearm-checklist.html",
  "blog/why-track-your-firearms.html"
];

const blogPosts = [];

function getMatch(html, regex, fallback = "") {
  const match = html.match(regex);
  return match ? match[1].trim() : fallback;
}

function yamlString(value) {
  return JSON.stringify(value || "");
}

function cleanContent(html) {
  const body = getMatch(html, /<body[^>]*>([\s\S]*?)<\/body>/i, html);
  const afterNav = body.includes("</nav>") ? body.slice(body.indexOf("</nav>") + "</nav>".length) : body;
  const footerIndex = afterNav.search(/<!--\s*Footer\s*-->/i);
  const withoutFooter = footerIndex >= 0 ? afterNav.slice(0, footerIndex) : afterNav;
  return withoutFooter
    .replace(/<script>\s*document\.getElementById\('mobile-menu-btn'\)[\s\S]*?<\/script>/gi, "")
    .replace(/<!-- Auto-deploy test[\s\S]*?-->/gi, "")
    .trim();
}

function extractHeadExtra(html) {
  const scripts = [...html.matchAll(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi)].map((match) => match[0].trim());
  return scripts.join("\n");
}

function extractDate(html) {
  const label = getMatch(html, /<i class="bi bi-calendar3[^>]*><\/i>\s*([^<]+)/i);
  if (!label) return "2026-03-10";
  return new Date(label).toISOString().slice(0, 10);
}

function extractReadTime(html) {
  return getMatch(html, /<i class="bi bi-clock[^>]*><\/i>\s*([^<]+)/i, "5 min read");
}

async function copyRecursive(from, to) {
  await mkdir(path.dirname(to), { recursive: true });
  const { cp } = await import("node:fs/promises");
  await cp(from, to, { recursive: true });
}

await mkdir(src, { recursive: true });

for (const dir of passthroughDirs) {
  if (existsSync(path.join(root, dir))) {
    await copyRecursive(path.join(root, dir), path.join(src, dir));
  }
}

for (const file of passthroughFiles) {
  if (existsSync(path.join(root, file))) {
    await copyFile(path.join(root, file), path.join(src, file));
  }
}

for (const file of htmlFiles) {
  const html = await readFile(path.join(root, file), "utf8");
  const isBlogPost = file.startsWith("blog/") && file !== "blog/index.html";
  const title = getMatch(html, /<title>([\s\S]*?)<\/title>/i).replace(/\s+/g, " ");
  const description = getMatch(html, /<meta name="description" content="([^"]*)"/i);
  const canonical = getMatch(html, /<link rel="canonical" href="([^"]*)"/i);
  const ogType = getMatch(html, /<meta property="og:type" content="([^"]*)"/i, isBlogPost ? "article" : "website");
  const ogTitle = getMatch(html, /<meta property="og:title" content="([^"]*)"/i);
  const ogDescription = getMatch(html, /<meta property="og:description" content="([^"]*)"/i);
  const ogImage = getMatch(html, /<meta property="og:image" content="([^"]*)"/i);
  const bodyClass = getMatch(html, /<body class="([^"]*)"/i, "bg-gray-50");
  const headExtra = extractHeadExtra(html);
  const content = cleanContent(html);
  const permalink = file;
  const outPath = path.join(src, file.replace(/\.html$/, ".njk"));
  const frontMatter = [
    "---",
    `layout: layouts/base.njk`,
    `permalink: ${yamlString(permalink)}`,
    `title: ${yamlString(title)}`,
    `description: ${yamlString(description)}`,
    `canonical: ${yamlString(canonical)}`,
    `ogType: ${yamlString(ogType)}`,
    `ogTitle: ${yamlString(ogTitle)}`,
    `ogDescription: ${yamlString(ogDescription)}`,
    `ogImage: ${yamlString(ogImage)}`,
    `bodyClass: ${yamlString(bodyClass)}`,
    isBlogPost ? `tags: ["posts"]` : "",
    isBlogPost ? `date: ${extractDate(html)}` : "",
    isBlogPost ? `readTime: ${yamlString(extractReadTime(html))}` : "",
    headExtra ? `headExtra: |\n${headExtra.split("\n").map((line) => `  ${line}`).join("\n")}` : "",
    "---",
    ""
  ].filter(Boolean).join("\n");

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${frontMatter}${content}\n`, "utf8");

  if (isBlogPost) {
    blogPosts.push({ file, title, description, date: extractDate(html), readTime: extractReadTime(html) });
  }
}

const blogIndex = `---
layout: layouts/base.njk
permalink: "blog/index.html"
title: "Arsenal Vault Blog - Firearms Inventory Tips"
description: "Tips and guides for firearms inventory management, insurance documentation, collection tracking, and Arsenal Vault workflows."
canonical: "https://arsenalvault.com/blog/"
ogType: "website"
ogTitle: "Arsenal Vault Blog"
ogDescription: "Tips and guides for firearms inventory management, insurance documentation, collection tracking, and Arsenal Vault workflows."
ogImage: "https://arsenalvault.com/img/av-shield-512.png"
---
<header class="gradient-dark py-16">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 class="text-4xl lg:text-5xl font-display font-bold text-white mb-4">Arsenal Vault Blog</h1>
        <p class="text-gray-300 text-lg max-w-2xl mx-auto">Practical guides for firearms inventory management, insurance records, collection documentation, and smarter range prep.</p>
    </div>
</header>

<section class="py-16 bg-gray-50">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {% for post in collections.posts | reverse %}
            <article class="bg-white rounded-2xl border border-gray-200 p-7 hover-lift shadow-sm">
                <div class="text-sm text-gray-500 mb-3">
                    <span><i class="bi bi-calendar3 mr-1"></i>{{ post.date | readableDate }}</span>
                    {% if post.data.readTime %}<span class="ml-3"><i class="bi bi-clock mr-1"></i>{{ post.data.readTime }}</span>{% endif %}
                </div>
                <h2 class="text-xl font-display font-bold text-gray-900 mb-3">
                    <a href="{{ post.url }}" class="hover:text-av-gold transition">{{ post.data.ogTitle or post.data.title }}</a>
                </h2>
                <p class="text-gray-600 mb-5">{{ post.data.description }}</p>
                <a href="{{ post.url }}" class="inline-flex items-center gap-2 text-av-gold font-semibold hover:underline">Read Article <i class="bi bi-arrow-right"></i></a>
            </article>
            {% endfor %}
        </div>
    </div>
</section>
`;

await writeFile(path.join(src, "blog/index.njk"), blogIndex, "utf8");

const sitemap = `---
permalink: "sitemap.xml"
eleventyExcludeFromCollections: true
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{% for item in collections.all %}
{% if item.url and not item.data.eleventyExcludeFromCollections %}
  <url>
    <loc>{{ item.url | absoluteUrl }}</loc>
    <lastmod>{{ (item.date or page.date).toISOString().slice(0, 10) }}</lastmod>
    <changefreq>{% if item.url.startsWith('/blog/') %}monthly{% else %}monthly{% endif %}</changefreq>
    <priority>{% if item.url == '/' %}1.0{% elif item.url.startsWith('/blog/') %}0.8{% else %}0.7{% endif %}</priority>
  </url>
{% endif %}
{% endfor %}
</urlset>
`;

await writeFile(path.join(src, "sitemap.njk"), sitemap, "utf8");

const feed = `---
permalink: "feed.xml"
eleventyExcludeFromCollections: true
---
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Arsenal Vault Blog</title>
  <subtitle>{{ site.description }}</subtitle>
  <link href="{{ '/feed.xml' | absoluteUrl }}" rel="self"/>
  <link href="{{ '/blog/' | absoluteUrl }}"/>
  <updated>{{ collections.posts | getNewestCollectionItemDate | dateToRfc3339 }}</updated>
  <id>{{ '/blog/' | absoluteUrl }}</id>
  {% for post in collections.posts | reverse %}
  <entry>
    <title>{{ post.data.ogTitle or post.data.title }}</title>
    <link href="{{ post.url | absoluteUrl }}"/>
    <updated>{{ post.date | dateToRfc3339 }}</updated>
    <id>{{ post.url | absoluteUrl }}</id>
    <summary>{{ post.data.description }}</summary>
  </entry>
  {% endfor %}
</feed>
`;

await writeFile(path.join(src, "feed.njk"), feed, "utf8");

console.log(`Migrated ${htmlFiles.length} pages and ${blogPosts.length} blog posts.`);
