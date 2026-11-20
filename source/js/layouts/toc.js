import { initTocToggle } from "../tools/tocToggle.js";
import { getStyleStatus } from "../state/styleStatus.js";

export function initTOC({ signal } = {}) {
  const tocContainer = document.getElementById("article-toc");
  if (!tocContainer) {
    return null;
  }

  const navItems = tocContainer.querySelectorAll(".nav-item");
  const tocToggle = initTocToggle();

  if (navItems.length === 0) {
    tocToggle.hideToggle();
    tocContainer.remove();
    document.querySelectorAll(".toc-marker").forEach((elem) => {
      elem.remove();
    });
    return null;
  }

  const navLinks = tocContainer.querySelectorAll("a.nav-link");
  const content = tocContainer.firstElementChild;
  const indicator = document.createElement("span");
  indicator.className = "toc-indicator";
  indicator.setAttribute("aria-hidden", "true");
  content.append(indicator);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const updateEdges = () => {
    const remaining =
      tocContainer.scrollHeight - tocContainer.clientHeight - tocContainer.scrollTop;
    tocContainer.style.setProperty(
      "--toc-fade-top",
      `${Math.min(16, Math.max(0, tocContainer.scrollTop))}px`,
    );
    tocContainer.style.setProperty(
      "--toc-fade-bottom",
      `${Math.min(16, Math.max(0, remaining))}px`,
    );
  };

  const updateIndicator = () => {
    const target = tocContainer.querySelector('[aria-current="location"]');
    if (!target || !tocContainer.clientHeight) return;
    const rect = target.getBoundingClientRect();
    const origin = content.getBoundingClientRect();
    indicator.style.transform =
      `translate(${rect.left - origin.left - 12}px, ${rect.top - origin.top}px)`;
    indicator.style.height = `${rect.height}px`;
    if (!indicator.dataset.ready) {
      getComputedStyle(indicator).transform;
      indicator.dataset.ready = "true";
    }
  };

  const utils = {
    navItems,
    navLinks,

    updateActiveTOCLink() {
      if (!Array.isArray(utils.sections)) return;
      let index = utils.sections.findIndex((element) => {
        return element && element.getBoundingClientRect().top - 100 > 0;
      });
      if (index === -1) {
        index = utils.sections.length - 1;
      } else if (index > 0) {
        index--;
      }
      this.activateTOCLink(index);
    },

    registerTOCScroll() {
      utils.sections = [...utils.navLinks].map((element) => {
        const target = document.getElementById(
          decodeURI(element.getAttribute("href")).replace("#", ""),
        );
        return target;
      });
    },

    activateTOCLink(index) {
      const target = utils.navLinks[index];
      if (!target || target.getAttribute("aria-current") === "location") return;
      utils.navLinks.forEach((link) => {
        link.removeAttribute("aria-current");
      });
      utils.navItems.forEach((item) => {
        delete item.dataset.active;
      });
      target.setAttribute("aria-current", "location");

      let activeItem = target.closest(".nav-item");
      while (activeItem && tocContainer.contains(activeItem)) {
        activeItem.dataset.active = "true";
        activeItem = activeItem.parentElement?.closest(".nav-item");
      }
      updateIndicator();
      updateEdges();

      const tocTop = tocContainer.getBoundingClientRect().top;
      const scrollTopOffset =
        tocContainer.offsetHeight > window.innerHeight
          ? (tocContainer.offsetHeight - window.innerHeight) / 2
          : 0;
      const targetTop = target.getBoundingClientRect().top - tocTop;
      const viewportHeight = Math.max(
        document.documentElement.clientHeight,
        window.innerHeight || 0,
      );
      const distanceToCenter =
        targetTop -
        viewportHeight / 2 +
        target.offsetHeight / 2 -
        scrollTopOffset;
      const scrollTop = tocContainer.scrollTop + distanceToCenter;

      tocContainer.scrollTo({
        top: scrollTop,
        behavior: reducedMotion.matches ? "instant" : "smooth",
      });
    },

    showTOCAside() {
      const openHandle = () => {
        const styleStatus = getStyleStatus();
        const key = "isOpenPageAside";
        if (styleStatus && styleStatus.hasOwnProperty(key)) {
          tocToggle.pageAsideHandleOfTOC(styleStatus[key]);
        } else {
          tocToggle.pageAsideHandleOfTOC(true);
        }
      };

      const initOpenKey = "init_open";

      if (theme.articles.toc.hasOwnProperty(initOpenKey)) {
        theme.articles.toc[initOpenKey]
          ? openHandle()
          : tocToggle.pageAsideHandleOfTOC(false);
      } else {
        openHandle();
      }
    },
  };

  utils.showTOCAside();
  utils.registerTOCScroll();
  utils.updateActiveTOCLink();

  const observer = new ResizeObserver(() => {
    updateIndicator();
    updateEdges();
  });
  observer.observe(tocContainer);
  observer.observe(content);
  tocContainer.addEventListener("scroll", updateEdges, { passive: true, signal });
  window.addEventListener("scroll", () => utils.updateActiveTOCLink(), {
    passive: true,
    signal,
  });
  signal?.addEventListener("abort", () => {
    observer.disconnect();
    indicator.remove();
  }, { once: true });
  return utils;
}
