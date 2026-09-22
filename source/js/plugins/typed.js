/*
 author: @jiangwen5945 & EvanNotFound
*/

const instances = new Map();
const initTokens = new Map();

const normalizeSubtitleText = (subtitleText) => {
  if (Array.isArray(subtitleText)) {
    return subtitleText.filter((entry) => typeof entry === "string" && entry);
  }

  if (typeof subtitleText === "string" && subtitleText) {
    return [subtitleText];
  }

  return [];
};

const removeCursorSiblings = (element) => {
  if (!element?.parentNode) {
    return;
  }

  let sibling = element.nextSibling;
  while (sibling?.classList?.contains("typed-cursor")) {
    const next = sibling.nextSibling;
    sibling.remove();
    sibling = next;
  }
};

const destroyInstance = (id) => {
  const instance = instances.get(id);
  if (instance && typeof instance.destroy === "function") {
    try {
      if (instance.timeout) {
        clearTimeout(instance.timeout);
      }
      instance.destroy();
      if (instance.timeout) {
        clearTimeout(instance.timeout);
      }
    } catch (error) {
      console.error("Failed to destroy Typed instance:", error);
    }
  }

  instances.delete(id);

  const element = document.getElementById(id);
  if (element) {
    element.innerHTML = "";
    removeCursorSiblings(element);
  }
};

// Bump the token first so a hitokoto response still in flight cannot
// start another Typed after the page has gone away.
export function destroyTyped(id) {
  initTokens.set(id, (initTokens.get(id) || 0) + 1);
  destroyInstance(id);
}

const createTyped = (id, strings, options, callbacks = {}) => {
  if (typeof window.Typed === "undefined") {
    return;
  }

  destroyInstance(id);

  if (!document.getElementById(id)) {
    return;
  }

  const instance = new window.Typed(`#${id}`, {
    strings,
    typeSpeed: options.typeSpeed,
    smartBackspace: options.smartBackspace,
    backSpeed: options.backSpeed,
    backDelay: options.backDelay,
    loop: options.loop,
    startDelay: options.startDelay,
    ...callbacks,
  });

  instances.set(id, instance);
};

const subtitleConfig = theme?.home_banner?.subtitle || {};
const hitokotoConfig = subtitleConfig.hitokoto || {};

const getHitokotoText = (data) => {
  const quote = typeof data?.hitokoto === "string" ? data.hitokoto : "";
  if (!quote) {
    return "";
  }

  const author =
    typeof data?.from_who === "string" && hitokotoConfig.show_author
      ? data.from_who
      : "";
  return author ? `${quote}——${author}` : quote;
};

const fetchHitokoto = (api) =>
  fetch(api)
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Hitokoto request failed with status ${response.status}`,
        );
      }

      return response.json();
    })
    .then(getHitokotoText)
    .then((text) => {
      if (!text) {
        throw new Error("Hitokoto response did not contain a quote");
      }

      return text;
    });

export const config = {
  usrTypeSpeed: subtitleConfig.typing_speed,
  usrBackSpeed: subtitleConfig.backing_speed,
  usrBackDelay: subtitleConfig.backing_delay,
  usrStartDelay: subtitleConfig.starting_delay,
  usrLoop: subtitleConfig.loop,
  usrSmartBackspace: subtitleConfig.smart_backspace,
  usrHitokotoAPI: hitokotoConfig.api,
};

export default function initTyped(id) {
  const currentToken = (initTokens.get(id) || 0) + 1;
  initTokens.set(id, currentToken);
  destroyInstance(id);

  const {
    usrTypeSpeed,
    usrBackSpeed,
    usrBackDelay,
    usrStartDelay,
    usrLoop,
    usrSmartBackspace,
    usrHitokotoAPI,
  } = config;

  const options = {
    typeSpeed: usrTypeSpeed ?? 100,
    smartBackspace: usrSmartBackspace ?? false,
    backSpeed: usrBackSpeed ?? 80,
    backDelay: usrBackDelay ?? 1500,
    loop: usrLoop ?? false,
    startDelay: usrStartDelay ?? 500,
  };

  const hitokotoEnabled = Boolean(hitokotoConfig.enable);

  if (hitokotoEnabled) {
    if (!usrHitokotoAPI) {
      return;
    }

    fetchHitokoto(usrHitokotoAPI)
      .then((text) => {
        if (initTokens.get(id) !== currentToken) {
          return;
        }

        const shouldRefreshOnLoop = Boolean(
          hitokotoConfig.refresh_on_loop && options.loop,
        );

        if (!shouldRefreshOnLoop) {
          createTyped(id, [text], options);
          return;
        }

        let currentText = text;
        let nextText = null;
        let refreshRequest = null;

        const prefetchNextText = () => {
          if (refreshRequest || nextText) {
            return;
          }

          refreshRequest = fetchHitokoto(usrHitokotoAPI)
            .then((nextQuote) => {
              if (initTokens.get(id) === currentToken) {
                nextText = nextQuote;
              }
            })
            .catch((error) => {
              console.error("Failed to refresh hitokoto:", error);
            })
            .finally(() => {
              refreshRequest = null;
            });
        };

        createTyped(id, [currentText], options, {
          onStringTyped: prefetchNextText,
          onLastStringBackspaced: (instance) => {
            if (nextText) {
              currentText = nextText;
              nextText = null;
            }

            instance.strings[0] = currentText;
          },
        });
      })
      .catch((error) => {
        console.error("Failed to fetch hitokoto:", error);
      });

    return;
  }

  const subtitleEntries = normalizeSubtitleText(subtitleConfig.text);
  if (subtitleEntries.length === 0) {
    return;
  }

  createTyped(id, subtitleEntries, options);
}
