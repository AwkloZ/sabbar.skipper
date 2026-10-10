// Injected into sabbar.com pages (main world, before any site script runs).
// Overrides the browser properties sites use to decide "desktop or phone?".
(() => {
  const device = self.__sabbarSkipperDevice;
  if (!device) return;
  delete self.__sabbarSkipperDevice;

  const define = (target, prop, value) => {
    try {
      Object.defineProperty(target, prop, { get: () => value, configurable: true, enumerable: true });
    } catch (_) {}
  };

  const nav = Navigator.prototype;
  define(nav, "userAgent", device.userAgent);
  define(nav, "appVersion", device.userAgent.replace(/^Mozilla\//, ""));
  define(nav, "platform", device.platform);
  define(nav, "vendor", device.vendor);
  define(nav, "maxTouchPoints", device.maxTouchPoints);

  if (device.uaData) {
    const { brands, platform, platformVersion, model, fullVersion } = device.uaData;
    const lowEntropy = { brands, mobile: true, platform };
    const highEntropy = {
      ...lowEntropy,
      architecture: "arm",
      bitness: "64",
      model,
      platformVersion,
      uaFullVersion: fullVersion,
      fullVersionList: brands.map((b) => ({ brand: b.brand, version: fullVersion })),
      wow64: false,
    };
    define(nav, "userAgentData", {
      ...lowEntropy,
      getHighEntropyValues: async (hints = []) => {
        const out = { ...lowEntropy };
        for (const hint of hints) if (hint in highEntropy) out[hint] = highEntropy[hint];
        return out;
      },
      toJSON: () => lowEntropy,
    });
  } else {
    define(nav, "userAgentData", undefined);
  }

  // "Is this a touch screen?" checks.
  for (const target of [window, Document.prototype, HTMLElement.prototype]) {
    if (!("ontouchstart" in target)) {
      try { target.ontouchstart = null; } catch (_) {}
    }
  }

  // matchMedia("(pointer: coarse)") / "(hover: none)" checks.
  const ALWAYS = "(min-width: 0px)";
  const NEVER = "(min-resolution: 100000dppx)";
  const originalMatchMedia = window.matchMedia.bind(window);
  window.matchMedia = (query) =>
    originalMatchMedia(
      String(query)
        .replace(/\(\s*(any-)?pointer\s*:\s*coarse\s*\)/gi, ALWAYS)
        .replace(/\(\s*(any-)?pointer\s*:\s*fine\s*\)/gi, NEVER)
        .replace(/\(\s*(any-)?hover\s*:\s*none\s*\)/gi, ALWAYS)
        .replace(/\(\s*(any-)?hover\s*:\s*hover\s*\)/gi, NEVER)
    );
})();
