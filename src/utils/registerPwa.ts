function getPwaScopePath() {
  if (window.location.hostname === "kou-no1.github.io" && window.location.pathname.startsWith("/todofuken/")) {
    return "/todofuken/";
  }

  return "/";
}

export function registerPwa() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    const scope = getPwaScopePath();

    navigator.serviceWorker
      .register(`${scope}sw.js`, { scope })
      .then((registration) => {
        registration.update().catch(() => undefined);
      })
      .catch(() => undefined);
  });
}
