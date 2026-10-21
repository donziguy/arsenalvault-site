const { execFileSync } = require("child_process");
const path = require("path");
const pluginRss = require("@11ty/eleventy-plugin-rss");

function compileTailwind() {
  const cli = require.resolve("tailwindcss/lib/cli.js");
  execFileSync(process.execPath, [
    cli,
    "--minify",
    "-c", path.join(__dirname, "tailwind.config.js"),
    "-i", path.join(__dirname, "src/styles/tailwind.css"),
    "-o", path.join(__dirname, "src/styles/tailwind.generated.css")
  ], { stdio: "inherit" });
}

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss.default);

  eleventyConfig.on("eleventy.before", compileTailwind);
  eleventyConfig.addWatchTarget("./src/styles/tailwind.css");
  eleventyConfig.addWatchTarget("./tailwind.config.js");

  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("static");
  eleventyConfig.addPassthroughCopy({ "src/styles/tailwind.generated.css": "css/tailwind.css" });
  eleventyConfig.addPassthroughCopy({ "src/.htaccess": ".htaccess" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });

  eleventyConfig.addFilter("siteUrl", function(path) {
    return new URL(path, "https://arsenalvault.com").href;
  });

  eleventyConfig.addFilter("jsonLd", function(value) {
    return JSON.stringify(value, null, 2);
  });

  eleventyConfig.addFilter("readableDate", function(value) {
    const date = new Date(value);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
