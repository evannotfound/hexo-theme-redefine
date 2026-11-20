import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  buildDevelopmentJavaScript,
  buildStyles,
  generateSite,
  outputExists,
  readOutput,
  ROOT,
} from "./support/site.mjs";

const includes = (output, values) => {
  values.forEach((value) => assert.ok(output.includes(value), `missing ${value}`));
};

const borderedPageTitle =
  '<h1 class="text-4xl mt-4 mb-8 font-medium font-display tracking-tight border-b border-rd-gray-alpha-400 pb-2">';

const getArticleToc = (output) =>
  output.match(/<aside id="article-toc"[\s\S]*?<\/aside>/)?.[0] || "";

const getHomeCard = (output, title) =>
  output
    .split('<li data-home-card')
    .find((card) => card.includes(`>${title}</a>`)) || "";

const getCategoryPaths = (output, attribute) =>
  [...output.matchAll(new RegExp(`<li ${attribute}[^>]*>([\\s\\S]*?)<\\/li>`, "g"))].map(
    ([, categoryPath]) => categoryPath,
  );

const readTemplates = (directory) => fs.readdirSync(directory, { withFileTypes: true })
  .flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return readTemplates(entryPath);
    return entry.name.endsWith(".ejs") ? [[entryPath, fs.readFileSync(entryPath, "utf8")]] : [];
  });

test("theme templates use native Tailwind scales for fixed values", () => {
  const fixedArbitrary = /(?:^|\s)(?:[\w-]+:)*-?[\w-]+-\[-?\d+(?:\.\d+)?(?:px|rem|%|vh|vw|ms)?\]/g;
  const matches = readTemplates(path.join(ROOT, "layout"))
    .flatMap(([file, source]) => [...source.matchAll(fixedArbitrary)]
      .map((match) => `${path.relative(ROOT, file)}:${match[0].trim()}`));

  assert.deepEqual(matches, []);
});

test("theme build and generation configurations", async (t) => {
  buildStyles();

  await t.test("CSS build produces the theme stylesheet", () => {
    const cssPath = path.join(ROOT, "source", "css", "build", "theme.css");
    assert.ok(fs.statSync(cssPath).size > 0);
    const css = fs.readFileSync(cssPath, "utf8");
    includes(css, [
      ".max-w-content{max-width:var(--content-max-width)}",
      "max-width:var(--content-with-toc-max-width)!important",
    ]);
    assert.ok(!css.includes("--archive-timeline-last-child-color"));
    assert.ok(!css.includes("@media (width<40rem)"));
    assert.ok(!css.includes("@media (width<48rem)"));
  });

  generateSite();

  await t.test("default site renders core structure and configured styles", () => {
    const home = readOutput();
    const post = readOutput("2022/10/02/theme-demo/index.html");
    includes(home, [
      'id="redefine-theme-vars"',
      "--content-max-width:1000px",
      "--image-radius:12px",
      'data-home-banner="fixed"',
      "data-sidebar-panel",
      "hidden w-60 shrink-0 self-stretch md:block",
      'class="order-last rounded-2xl border',
      'aria-label="Theme Redefine" class="order-first overflow-hidden',
      "data-sidebar-link",
      'id="page-shell"',
      'id="main-content"',
      'id="site-footer"',
      'role="timer" aria-live="off"',
      '<number-flow id="runtime_days" data-number-unit="days"></number-flow>',
      '<number-flow data-scroll-percent',
      'id="side-tools" data-state="visible" class="fixed',
      'class="flex flex-col items-end gap-1"',
      'id="side-tools-menu" data-state="closed" aria-hidden="true" class="invisible absolute right-0 bottom-full mb-1 flex flex-col gap-1 opacity-0 pointer-events-none transition-opacity',
    ]);
    const sideToolsMenu = home.match(/<div id="side-tools-menu"[^>]+>/)?.[0] || "";
    const sideToolsToggle = home.match(/<button id="side-tools-toggle"[\s\S]*?<\/button>/)?.[0] || "";
    const categorizedCard = getHomeCard(home, "主题样式 Demo - With Banner");
    const homeCategoryPaths = getCategoryPaths(categorizedCard, "data-home-category-path");
    assert.ok(!sideToolsMenu.includes("translate-x"));
    assert.ok(!sideToolsMenu.includes("transition-[transform,opacity]"));
    assert.ok(sideToolsToggle.includes("group-hover:animate-spin"));
    assert.ok(sideToolsToggle.includes("group-hover:[animation-duration:2s]"));
    assert.ok(sideToolsToggle.includes("motion-reduce:group-hover:animate-none"));
    assert.ok(!sideToolsToggle.includes("fa-spin"));
    assert.equal(homeCategoryPaths.length, 2);
    assert.ok(homeCategoryPaths[0].includes(">demo123</a>"));
    assert.ok(homeCategoryPaths[1].includes(">demo456</a>"));
    assert.ok(homeCategoryPaths[1].includes(">demo789</a>"));
    assert.ok(homeCategoryPaths[1].includes("fa-angle-right"));
    assert.ok(!home.includes("data-home-word-count"));
    assert.ok(!home.includes("data-home-reading-time"));
    assert.ok(!home.includes('data-side-tool class="hidden size-10'));
    assert.equal(home.split('href="/essays"').length, 3);
    includes(post, ['id="article-layout"', 'id="toc-toggle"']);
    includes(post, [
      '<meta name="twitter:card" content="summary_large_image">',
      '<meta property="og:image" content="https://redefine.ohevan.com/images/redefine-og.webp">',
      '<meta name="twitter:image" content="https://redefine.ohevan.com/images/redefine-og.webp">',
    ]);
    [home, post].forEach((output) => {
      assert.equal(output.split('id="swup"').length, 2);
      assert.equal(output.split('id="page-content"').length, 2);
      assert.equal(output.split('id="main-content"').length, 2);
    });
    assert.ok(!home.includes('id="toc-toggle"'));
    assert.ok(!post.includes("data-home-banner"));
    assert.ok(!home.includes("--rd-shadow:"), "fixed shadow leaked into generated styles");
    assert.ok(!home.includes("odometer"));
    assert.ok(!home.includes("esm.sh"));
    assert.ok(outputExists("css/build/theme.css"));
    assert.ok(!outputExists("css/build/plugins/odometer.css"));
  });

  await t.test("article TOC omits titles above the configured length", () => {
    const shortTitleToc = getArticleToc(readOutput("2022/10/02/theme-demo/index.html"));
    const longTitleToc = getArticleToc(readOutput("2024/01/17/super-long-title-test/index.html"));

    assert.ok(shortTitleToc.includes("主题样式 Demo"));
    assert.ok(!longTitleToc.includes("This is an extremely long title"));
    assert.ok(longTitleToc.includes("Super Long Title Test"));
  });

  await t.test("archive renders an unframed semantic timeline", () => {
    const archive = readOutput("archives/index.html");
    includes(archive, [
      borderedPageTitle,
      '<ol class="timeline',
      'class="timeline-post relative"',
      "<time datetime=",
    ]);
    assert.ok(!archive.includes("data-date="));
  });

  await t.test("documented custom templates render their route content", () => {
    const routes = {
      "masonry/index.html": 'id="masonry-container"',
      "bookmarks/index.html": "data-bookmark-nav",
      "essays/index.html": "data-essay-date",
    };

    Object.entries(routes).forEach(([route, marker]) => {
      assert.ok(readOutput(route).includes(marker), `${route} is missing ${marker}`);
    });

    assert.ok(readOutput("masonry/index.html").includes(borderedPageTitle));

    const categories = readOutput("categories/index.html");
    includes(categories, [
      'class="mb-4 pt-5 sm:mb-6 sm:pt-0 md:mb-8"',
      "data-category-group",
      "data-category-toggle",
      'class="fa-solid fa-chevron-right',
      "Subcategories",
      borderedPageTitle,
    ]);
    assert.match(
      categories,
      /aria-controls="([^"]+)"[^>]*>[\s\S]*?<ul id="\1" hidden/,
    );
    assert.ok(!categories.includes("category-list-item"));
    assert.ok(!categories.includes('class="box-border mb-8 rounded-2xl border'));
    assert.ok(!categories.includes('id="comments"'));

    const tags = readOutput("tags/index.html");
    includes(tags, [
      'class="mb-4 pt-5 sm:mb-6 sm:pt-0 md:mb-8"',
      "group/tags",
      borderedPageTitle,
    ]);
    const tagTiers = new Map();
    const tagPattern = /class="[^"]* (blur-sm|blur-xs|opacity-70|blur-none)" href="\/tags\/[^"]+\/">[\s\S]*?<span[^>]*>(\d+)<\/span>/g;
    for (const [, blurClass, count] of tags.matchAll(tagPattern)) {
      const classes = tagTiers.get(Number(count)) || new Set();
      classes.add(blurClass);
      tagTiers.set(Number(count), classes);
    }
    const tagCounts = [...tagTiers.keys()].sort((a, b) => a - b);
    assert.ok(tagCounts.length > 1);
    tagTiers.forEach((classes) => assert.equal(classes.size, 1));
    assert.deepEqual([...tagTiers.get(tagCounts[0])], ["blur-sm"]);
    assert.deepEqual([...tagTiers.get(tagCounts.at(-1))], ["blur-none"]);
    assert.ok(!tags.includes('class="box-border mb-8 rounded-2xl border'));
    assert.ok(!tags.includes('id="comments"'));

    const tag = readOutput("tags/test/index.html");
    includes(tag, [
      borderedPageTitle,
      'class="fa-regular fa-hashtag text-rd-gray-800"',
      'class="paginator',
    ]);
    assert.ok(!tag.includes('class="box-border mb-4 rounded-none border-0'));

    const category = readOutput("categories/Demo/index.html");
    includes(category, [
      borderedPageTitle,
      'class="fa-regular fa-folder text-rd-gray-800"',
      'class="paginator',
    ]);
    assert.ok(!category.includes('class="box-border mb-4 rounded-none border-0'));

    const categorizedPost = readOutput("2023/02/14/theme-demo-with-banner/index.html");
    const postCategoryPaths = getCategoryPaths(categorizedPost, "data-post-category-path");
    assert.equal(postCategoryPaths.length, 2);
    assert.ok(postCategoryPaths[1].includes(">demo456</a>"));
    assert.ok(postCategoryPaths[1].includes(">demo789</a>"));
  });

  await t.test("legacy and unknown templates use ordinary page rendering", () => {
    const pages = {
      "legacy-template/index.html": "links",
      "shuoshuo/index.html": "shuoshuo",
      "unknown-template/index.html": "Unknown Template",
    };

    Object.entries(pages).forEach(([route, title]) => {
      assert.ok(readOutput(route).includes(`<h1>${title}</h1>`));
    });
    assert.equal(readOutput("showcase/index.html").split('id="comments"').length, 2);
  });

  await t.test("default configuration loads only enabled style assets", () => {
    const home = readOutput();
    includes(home, [
      "/css/build/plugins/code-themes/light/github.css",
      "/css/build/plugins/code-themes/dark/vs2015.css",
      "/css/build/plugins/comments/waline.css",
    ]);
    assert.ok(!home.includes("/css/build/plugins/aplayer.css"));
  });

  generateSite(path.join(ROOT, "tests", "fixtures", "optional-theme-config.yml"));

  await t.test("optional configuration renders enabled controls and writing modules", () => {
    const home = readOutput();
    const writing = readOutput("2022/10/02/theme-demo/index.html");
    const nested = readOutput("2026/08/06/tab-folding-nesting-test/index.html");
    includes(home, ['id="local-search"', 'id="reading-progress"', 'id="preloader"', 'id="aplayer"']);
    includes(writing, ["data-writing-button", 'data-lazy-state="pending"']);
    assert.ok(!getArticleToc(writing).includes("主题样式 Demo"));
    includes(nested, ["data-tabs", 'role="tabpanel"', 'class="folding']);
    const categorizedCard = getHomeCard(home, "主题样式 Demo - With Banner");
    const categoryPaths = getCategoryPaths(categorizedCard, "data-home-category-path");
    assert.equal(categoryPaths.length, 1);
    assert.ok(categoryPaths[0].includes(">demo123</a>"));
    assert.match(home, /data-home-word-count[^>]*>[\s\S]*?\d+ Words<\/span>/);
    assert.match(home, /data-home-reading-time[^>]*>[\s\S]*?\d+ Mins<\/span>/);
  });

  await t.test("optional configuration selects only configured style assets", () => {
    const home = readOutput();
    includes(home, [
      "/css/build/plugins/code-themes/light/atom-one-light.css",
      "/css/build/plugins/code-themes/dark/nord.css",
      "/css/build/plugins/comments/twikoo.css",
      "/css/build/plugins/aplayer.css",
      'data-aplayer-mode="fixed"',
    ]);
    assert.ok(!home.includes("/css/build/plugins/comments/waline.css"));
    assert.ok(!home.includes("/css/build/plugins/odometer.css"));
    assert.ok(!home.includes("<number-flow"));
    assert.ok(!home.includes("odometer.min.js"));
    assert.ok(!home.includes("esm.sh"));
  });

  buildDevelopmentJavaScript();
  generateSite(path.join(ROOT, "dev", "site", "_config.dev.yml"));

  await t.test("canonical demo development uses the watched application bundle", () => {
    const home = readOutput();
    const devMain = path.join(ROOT, "source", "js", "build", "dev", "main.js");
    const devChunks = path.join(ROOT, "source", "js", "build", "dev", "chunks");

    assert.ok(home.includes('src="/js/build/dev/main.js"'));
    assert.ok(!home.includes('type="importmap"'));
    assert.ok(fs.statSync(devMain).size > 0);
    assert.ok(
      fs.readdirSync(devChunks).some((name) => name === "numberFlow.js"),
    );
    assert.ok(outputExists("js/build/dev/main.js"));
    assert.ok(home.includes("https://events.ohevan.com/script.js"));
  });
});
