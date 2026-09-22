/* main function */
import initCategoryList from "./layouts/categoryList.js";
import initHomeBanner from "./layouts/homeBanner.js";
import initLazyLoad from "./layouts/lazyload.js";
import { initTOC } from "./layouts/toc.js";
import { navbarShrink } from "./layouts/navbarShrink.js";
import initTabs from "./plugins/tabs.js";
import initCopyCode from "./tools/codeBlock.js";
import initExpirationDate from "./tools/expirationDate.js";
import initModeToggle from "./tools/lightDarkSwitch.js";
import initFooterRuntime from "./tools/runtime.js";
import initScrollTopBottom from "./tools/scrollTopBottom.js";
import { initTocToggle } from "./tools/tocToggle.js";
import { initUtilsGlobals, initUtilsPage } from "./utils.js";
import {
  getStyleStatus,
  setStyleStatus,
  styleStatus,
} from "./state/styleStatus.js";

const safeRun = (label, callback) => {
  try {
    callback();
  } catch (error) {
    console.error(`[redefine] ${label} failed:`, error);
  }
};

const safeRunAsync = (label, callback) => {
  Promise.resolve()
    .then(callback)
    .catch((error) => {
      console.error(`[redefine] ${label} failed:`, error);
    });
};

const lazyRun = (label, signal, load, callback) => {
  if (signal?.aborted) {
    return;
  }

  safeRunAsync(label, async () => {
    const module = await load();
    if (signal?.aborted) {
      return;
    }

    callback(module);
  });
};

const pageRefreshEvent = "redefine:page:refresh";
let globalsInitialized = false;
let didInitRefreshEvent = false;
let appController = null;
let pageController = null;
let typedModule = null;

const loadTypedModule = () => {
  const pending = import("./plugins/typed.js");
  pending
    .then((module) => {
      typedModule = module;
    })
    .catch(() => {});
  return pending;
};

const getAppSignal = () => {
  if (!appController) {
    appController = new AbortController();
  }

  return appController.signal;
};

const createPageScope = () => {
  if (pageController) {
    pageController.abort();
  }

  pageController = new AbortController();
  return pageController.signal;
};

const abortPageScope = () => {
  if (!pageController) {
    return;
  }

  pageController.abort();
  pageController = null;
};

const initGlobalsOnce = () => {
  if (globalsInitialized) {
    return;
  }

  globalsInitialized = true;
  const appSignal = getAppSignal();

  safeRun("utils:globals", () => {
    initUtilsGlobals({ signal: appSignal });
  });
  safeRun("navbar:globals", () => {
    navbarShrink.initGlobals({ signal: appSignal });
  });
  safeRun("tocToggle:globals", () => {
    initTocToggle({ signal: appSignal });
  });
  safeRun("scrollTopBottom:globals", () => {
    initScrollTopBottom({ signal: appSignal });
  });
  safeRun("tabs:globals", () => {
    initTabs({ signal: appSignal });
  });
  safeRun("categoryList:globals", () => {
    initCategoryList({ signal: appSignal });
  });
  if (theme.navbar?.search?.enable === true) {
    lazyRun(
      "localSearch:globals",
      appSignal,
      () => import("./tools/localSearch.js"),
      ({ initLocalSearchGlobals }) => {
        initLocalSearchGlobals({ signal: appSignal });
      },
    );
  }

  if (!didInitRefreshEvent) {
    didInitRefreshEvent = true;
    window.addEventListener(pageRefreshEvent, () => {
      initPage();
    });
  }
};

const initPage = () => {
  const pageSignal = createPageScope();
  const appSignal = getAppSignal();

  safeRun("utils:page", () => {
    initUtilsPage({ signal: pageSignal });
  });
  safeRun("homeBanner", () => {
    initHomeBanner({ signal: pageSignal });
  });
  safeRun("expirationDate", () => {
    initExpirationDate();
  });
  safeRun("modeToggle", () => {
    initModeToggle({ signal: pageSignal, appSignal });
  });
  const hasViewableImages = document.querySelector(
    '.markdown-body img:not([data-image-viewer="ignore"]), [data-masonry-item] img:not([data-image-viewer="ignore"]), .essay img:not([data-image-viewer="ignore"])',
  );
  if (hasViewableImages || document.querySelector("#masonry-container")) {
    lazyRun(
      "imageViewer",
      pageSignal,
      () => import("./tools/imageViewer.js"),
      ({ default: initImageViewer }) => {
        initImageViewer({ signal: pageSignal, appSignal });
      },
    );
  }

  navbarShrink.setNavigating(false);
  navbarShrink.refresh();

  safeRun("footerRuntime", () => {
    if (theme.footer?.runtime) {
      initFooterRuntime();
    }
  });

  if (
    theme.footer?.runtime ||
    theme.global?.scroll_progress?.percentage === true
  ) {
    lazyRun(
      "numberFlow",
      pageSignal,
      () => import("./plugins/numberFlow.js"),
      ({ default: initNumberFlow }) => {
        initNumberFlow();
      },
    );
  }

  safeRun("toc", () => {
    if (theme.articles?.toc?.enable) {
      initTOC({ signal: appSignal });
    }
  });

  safeRun("tabs", () => {
    if (theme.articles?.toc?.enable) {
      initTabs({ signal: appSignal });
    }
  });

  if (document.querySelector("[data-essay-date]") && typeof moment !== "undefined") {
    lazyRun(
      "essays",
      pageSignal,
      () => import("./layouts/essays.js"),
      ({ default: initEssays }) => {
        initEssays();
      },
    );
  }

  if (theme.articles?.pangu_js && document.querySelector(".markdown-body")) {
    lazyRun(
      "pangu",
      pageSignal,
      () => import("./plugins/pangu.js"),
      ({ default: initPangu }) => {
        initPangu();
      },
    );
  }

  if (
    theme.plugins?.mermaid?.enable &&
    document.querySelector(".mermaid")
  ) {
    lazyRun(
      "mermaid",
      pageSignal,
      () => import("./plugins/mermaid.js"),
      ({ default: initMermaid }) => {
        initMermaid();
      },
    );
  }

  if (document.querySelector("#masonry-container")) {
    lazyRun(
      "masonry",
      pageSignal,
      () => import("./plugins/masonry.js"),
      ({ default: initMasonry }) => {
        initMasonry({ signal: pageSignal });
      },
    );
  }

  const subtitleConfig = theme.home_banner?.subtitle || {};
  const subtitleText = subtitleConfig.text;
  const subtitleEntries = Array.isArray(subtitleText)
    ? subtitleText
    : subtitleText
      ? [subtitleText]
      : [];
  const shouldInitTyped =
    subtitleEntries.length !== 0 ||
    (subtitleConfig.hitokoto && subtitleConfig.hitokoto.enable);

  if (shouldInitTyped && location.pathname === config.root) {
    lazyRun(
      "typed",
      pageSignal,
      loadTypedModule,
      ({ default: initTyped }) => {
        initTyped("subtitle");
      },
    );
  }

  if (theme.navbar?.search?.enable === true) {
    lazyRun(
      "localSearch",
      pageSignal,
      () => import("./tools/localSearch.js"),
      ({ initLocalSearchPage }) => {
        initLocalSearchPage();
      },
    );
  }

  safeRun("copyCode", () => {
    if (theme.articles?.code_block?.copy === true) {
      initCopyCode();
    }
  });

  safeRun("lazyload", () => {
    if (theme.articles?.lazyload === true) {
      initLazyLoad();
    }
  });

  if (
    theme.bookmarks &&
    theme.bookmarks.length !== 0 &&
    document.querySelector("[data-bookmark-nav]")
  ) {
    lazyRun(
      "bookmarkNav",
      pageSignal,
      () => import("./layouts/bookmarkNav.js"),
      ({ default: initBookmarkNav }) => {
        initBookmarkNav({ signal: appSignal });
      },
    );
  }

};

export const main = {
  themeInfo: {
    theme: `Redefine v${theme.version}`,
    author: "EvanNotFound",
    repository: "https://github.com/EvanNotFound/hexo-theme-redefine",
  },
  styleStatus,
  getStyleStatus,
  setStyleStatus,
  printThemeInfo: () => {
    console.log(`
  +======================================================================================+
  |                                                                                      |
  |    _____ _   _ _____ __  __ _____   ____  _____ ____  _____ _____ ___ _   _ _____    |
  |   |_   _| | | | ____|  \\/  | ____| |  _ \\| ____|  _ \\| ____|  ___|_ _| \\ | | ____|   |
  |     | | | |_| |  _| | |\\/| |  _|   | |_) |  _| | | | |  _| | |_   | ||  \\| |  _|     |
  |     | | |  _  | |___| |  | | |___  |  _ <| |___| |_| | |___|  _|  | || |\\  | |___    |
  |     |_| |_| |_|_____|_|  |_|_____| |_| \\_\\_____|____/|_____|_|   |___|_| \\_|_____|   |
  |                                                                                      |
  |                  https://github.com/EvanNotFound/hexo-theme-redefine                 |
  +======================================================================================+
                  `,
    ); // console log message
  },
  refresh: () => {
    initPage();
  },
};

export function initMain() {
  main.printThemeInfo();
}

const initApp = () => {
  initMain();
  initGlobalsOnce();
  initPage();
};

const swup = window.swup;

if (swup?.hooks) {
  swup.hooks.on("page:view", initPage);
  swup.hooks.before("content:replace", () => {
    typedModule?.destroyTyped("subtitle");
    abortPageScope();
  });
  swup.hooks.on("visit:start", () => {
    navbarShrink.setNavigating(true);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp, { once: true });
} else {
  initApp();
}
