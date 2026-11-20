import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(
  new URL("../source/js/layouts/toc.js", import.meta.url), "utf8",
).replace(
  /^import .*;$/gm,
  "",
);
const { initTOC } = await import(
  `data:text/javascript;base64,${Buffer.from(`
    const initTocToggle = () => ({ pageAsideHandleOfTOC() {}, hideToggle() {} });
    const getStyleStatus = () => null;
    ${source}
  `).toString("base64")}`
);

test("TOC fades track overflow and the marker follows nested active headings", (t) => {
  const globals = ["document", "window", "theme", "ResizeObserver", "getComputedStyle"];
  const originals = globals.map((key) => globalThis[key]);
  t.after(() => globals.forEach((key, i) => {
    globalThis[key] = originals[i];
  }));
  const values = new Map();
  const container = new EventTarget();
  Object.assign(container, {
    scrollTop: 0, scrollHeight: 400, clientHeight: 200, offsetHeight: 200,
    style: { setProperty: (key, value) => values.set(key, value) },
    getBoundingClientRect: () => ({ top: 100 }),
    contains: () => true,
    scrollTo(options) { this.lastScroll = options; },
  });
  const content = {
    getBoundingClientRect: () => ({ top: 110 - container.scrollTop, left: 200 }),
    append() {},
  };
  const indicator = {
    style: {}, dataset: {}, setAttribute() {},
    remove() { this.removed = true; },
  };
  container.firstElementChild = content;
  const parent = { dataset: {}, parentElement: null };
  const child = {
    dataset: {}, parentElement: { closest: () => parent },
  };
  let nestedTop = 300;
  const headings = [
    { getBoundingClientRect: () => ({ top: 0 }) },
    { getBoundingClientRect: () => ({ top: nestedTop }) },
  ];
  const links = [parent, child].map((item, i) => {
    const attrs = new Map([["href", `#heading-${i}`]]);
    return {
      getAttribute: (key) => attrs.get(key),
      setAttribute: (key, value) => attrs.set(key, value),
      removeAttribute: (key) => attrs.delete(key),
      closest: () => item,
      offsetHeight: 28,
      getBoundingClientRect: () => ({
        left: 210 + i * 12,
        top: 150 + i * 32 - container.scrollTop,
        height: 28,
      }),
    };
  });
  container.querySelectorAll = (selector) =>
    selector === ".nav-item" ? [parent, child] : links;
  container.querySelector = () =>
    links.find((link) => link.getAttribute("aria-current") === "location");
  globalThis.document = {
    getElementById: (id) => id === "article-toc"
      ? container : headings[Number(id.split("-")[1])],
    createElement: () => indicator,
    documentElement: { clientHeight: 800 },
  };
  globalThis.window = new EventTarget();
  let reduced = false;
  window.innerHeight = 800;
  window.matchMedia = () => ({ get matches() { return reduced; } });
  globalThis.theme = { articles: { toc: {} } };
  globalThis.getComputedStyle = () => ({ transform: indicator.style.transform });
  let resize;
  let disconnected = false;
  globalThis.ResizeObserver = class {
    constructor(callback) { resize = callback; }
    observe() {}
    disconnect() { disconnected = true; }
  };
  const controller = new AbortController();
  initTOC({ signal: controller.signal });
  assert.equal(values.get("--toc-fade-top"), "0px");
  assert.equal(values.get("--toc-fade-bottom"), "16px");
  assert.equal(indicator.style.transform, "translate(-2px, 40px)");
  assert.equal(indicator.style.height, "28px");
  assert.equal(container.lastScroll.behavior, "smooth");

  container.scrollTop = 100;
  container.dispatchEvent(new Event("scroll"));
  assert.equal(values.get("--toc-fade-top"), "16px");
  assert.equal(values.get("--toc-fade-bottom"), "16px");
  nestedTop = 80;
  reduced = true;
  window.dispatchEvent(new Event("scroll"));
  assert.equal(links[1].getAttribute("aria-current"), "location");
  assert.equal(links[0].getAttribute("aria-current"), undefined);
  assert.equal(parent.dataset.active, "true");
  assert.equal(child.dataset.active, "true");
  assert.equal(indicator.style.transform, "translate(10px, 72px)");
  assert.equal(container.lastScroll.behavior, "instant");

  container.scrollTop = 200;
  container.dispatchEvent(new Event("scroll"));
  assert.equal(values.get("--toc-fade-bottom"), "0px");
  container.scrollTop = 0;
  container.scrollHeight = 100;
  resize();
  assert.equal(values.get("--toc-fade-top"), "0px");
  assert.equal(values.get("--toc-fade-bottom"), "0px");
  container.clientHeight = 0;
  resize();
  container.clientHeight = 200;
  resize();
  assert.equal(indicator.style.transform, "translate(10px, 72px)");

  controller.abort();
  assert.equal(disconnected, true);
  assert.equal(indicator.removed, true);
  nestedTop = 300;
  window.dispatchEvent(new Event("scroll"));
  assert.equal(links[1].getAttribute("aria-current"), "location");
  container.scrollTop = 50;
  container.dispatchEvent(new Event("scroll"));
  assert.equal(values.get("--toc-fade-top"), "0px");
});
