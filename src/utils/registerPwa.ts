function getPwaScopePath() {
  if (window.location.pathname.startsWith("/todofuken/")) {
    return "/todofuken/";
  }

  return "/";
}

export function registerPwa() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    return;
  }

  const register = () => {
    const scope = getPwaScopePath();

    navigator.serviceWorker
      .register(`${scope}sw.js`, { scope, updateViaCache: "none" })
      .then((registration) => {
        registration.update().catch(() => undefined);
      })
      .catch(() => undefined);
  };
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}
