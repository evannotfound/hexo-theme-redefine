import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(
  new URL("../source/js/layouts/navbarIndicator.js", import.meta.url),
  "utf8",
);
const { default: initNavbarIndicator } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);

test("navbar indicator follows items and returns home without reacting to gaps", (t) => {
  const nav = new EventTarget();
  const attributes = new Map();
  nav.setAttribute = (name, value) => attributes.set(name, value);
  nav.removeAttribute = (name) => attributes.delete(name);
  const values = new Map();
  nav.style = { setProperty: (key, value) => values.set(key, value) };
  nav.getBoundingClientRect = () => ({ left: 100 });
  const submenu = {};
  const home = {
    getBoundingClientRect: () => ({ left: 100, width: 60 }),
    parentElement: {
      contains: (target) => target === home,
      classList: { contains: () => false },
    },
  };
  const about = {
    getBoundingClientRect: () => ({ left: 200, width: 90 }),
    parentElement: {
      contains: (target) => target === about,
      classList: { contains: () => false },
    },
  };
  const dropdown = {
    parentElement: {
      contains: (target) => target === dropdown || target === submenu,
      classList: { contains: (name) => name === "navbar-dropdown" },
    },
  };
  let current = home;
  nav.querySelectorAll = () => [home, about, dropdown];
  nav.querySelector = () => current;
  let resize;
  let disconnected = false;
  const originalDocument = globalThis.document;
  const originalObserver = globalThis.ResizeObserver;
  const originalComputedStyle = globalThis.getComputedStyle;
  const initialStates = [];
  globalThis.getComputedStyle = (element, pseudo) => {
    assert.equal(element, nav);
    assert.equal(pseudo, "::after");
    assert.equal(attributes.has("data-indicator-ready"), false);
    initialStates.push(position());
    return { transform: "none" };
  };
  globalThis.document = { querySelector: () => nav };
  globalThis.ResizeObserver = class {
    constructor(callback) {
      resize = callback;
    }
    observe() {}
    disconnect() {
      disconnected = true;
    }
  };
  t.after(() => {
    globalThis.document = originalDocument;
    globalThis.ResizeObserver = originalObserver;
    globalThis.getComputedStyle = originalComputedStyle;
  });
  const send = (type, target, relatedTarget = null) => {
    const event = new Event(type);
    Object.defineProperties(event, {
      target: { value: target },
      relatedTarget: { value: relatedTarget },
    });
    nav.dispatchEvent(event);
  };
  const position = () => [
    values.get("--navbar-indicator-x"),
    values.get("--navbar-indicator-width"),
    values.get("--navbar-indicator-opacity"),
  ];

  const controller = new AbortController();
  initNavbarIndicator({ signal: controller.signal });
  assert.deepEqual(initialStates, [["0px", "60px", "1"]]);
  assert.equal(attributes.has("data-indicator-ready"), true);
  assert.deepEqual(position(), ["0px", "60px", "1"]);
  send("pointerover", about);
  assert.deepEqual(position(), ["100px", "90px", "1"]);
  send("pointerover", nav);
  assert.deepEqual(position(), ["100px", "90px", "1"]);
  send("pointerover", dropdown);
  assert.deepEqual(position(), ["100px", "90px", "0"]);
  send("pointerover", submenu);
  assert.deepEqual(position(), ["100px", "90px", "0"]);
  send("pointerleave", nav);
  assert.deepEqual(position(), ["0px", "60px", "1"]);

  send("focusin", about);
  assert.deepEqual(position(), ["100px", "90px", "1"]);
  send("focusout", about, dropdown);
  assert.deepEqual(position(), ["100px", "90px", "0"]);
  send("focusin", submenu);
  assert.deepEqual(position(), ["100px", "90px", "0"]);
  send("focusout", submenu, home);
  assert.deepEqual(position(), ["0px", "60px", "1"]);
  send("focusout", home);
  home.getBoundingClientRect = () => ({ left: 110, width: 70 });
  resize();
  assert.deepEqual(position(), ["10px", "70px", "1"]);

  controller.abort();
  assert.equal(disconnected, true);
  send("pointerover", about);
  assert.deepEqual(position(), ["10px", "70px", "1"]);

  // A new page without a matching link shows the bar only during interaction.
  current = null;
  const nextController = new AbortController();
  initNavbarIndicator({ signal: nextController.signal });
  assert.deepEqual(initialStates[1], ["10px", "70px", "0"]);
  assert.equal(attributes.has("data-indicator-ready"), true);
  assert.equal(values.get("--navbar-indicator-opacity"), "0");
  send("pointerover", about);
  assert.deepEqual(position(), ["100px", "90px", "1"]);
  send("pointerleave", nav);
  assert.equal(values.get("--navbar-indicator-opacity"), "0");
  nextController.abort();
});
