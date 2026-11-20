export default function initNavbarIndicator({ signal } = {}) {
  const nav = document.querySelector("[data-navbar-links]");
  if (!nav) return;
  nav.removeAttribute("data-indicator-ready");

  const links = Array.from(nav.querySelectorAll(".navbar-link"));
  const current = nav.querySelector('[aria-current="page"]');
  let hovered = null;
  let focused = null;

  const linkFor = (target) =>
    links.find((link) => link.parentElement.contains(target)) || null;

  const update = () => {
    const target = hovered || focused || current;
    const visible =
      target && !target.parentElement.classList.contains("navbar-dropdown");
    nav.style.setProperty("--navbar-indicator-opacity", visible ? "1" : "0");
    if (!visible) return;

    const bounds = target.getBoundingClientRect();
    const parent = nav.getBoundingClientRect();
    nav.style.setProperty(
      "--navbar-indicator-x",
      `${bounds.left - parent.left}px`,
    );
    nav.style.setProperty("--navbar-indicator-width", `${bounds.width}px`);
  };

  nav.addEventListener(
    "pointerover",
    (event) => {
      if (event.pointerType === "touch") return;
      hovered = linkFor(event.target) || hovered;
      update();
    },
    { signal },
  );
  nav.addEventListener(
    "pointerleave",
    () => {
      hovered = null;
      update();
    },
    { signal },
  );
  nav.addEventListener(
    "focusin",
    (event) => {
      focused = linkFor(event.target);
      hovered = null;
      update();
    },
    { signal },
  );
  nav.addEventListener(
    "focusout",
    (event) => {
      focused = linkFor(event.relatedTarget);
      update();
    },
    { signal },
  );

  const observer = new ResizeObserver(update);
  observer.observe(nav);
  links.forEach((link) => observer.observe(link));
  signal?.addEventListener("abort", () => observer.disconnect(), {
    once: true,
  });
  update();
  // Resolve the starting position before enabling interaction transitions.
  getComputedStyle(nav, "::after").transform;
  nav.setAttribute("data-indicator-ready", "");
}
