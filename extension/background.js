// Registers the page scripts and header rewrite according to the popup settings.
const MATCHES = ["*://*.sabbar.com/*"];
const FINDER_ID = "sabbar-skipper-finder";
const PHONE_ID = "sabbar-skipper-phone";
const RULE_ID = 1;
const RESOURCE_TYPES = ["main_frame", "sub_frame", "xmlhttprequest", "script", "stylesheet", "image", "font", "media", "websocket", "ping", "other"];

const HEADERS = {
  android: [
    { header: "User-Agent", operation: "set", value: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36" },
    { header: "Sec-CH-UA-Mobile", operation: "set", value: "?1" },
    { header: "Sec-CH-UA-Platform", operation: "set", value: '"Android"' },
    { header: "Sec-CH-UA-Model", operation: "set", value: '"Pixel 8"' },
  ],
  iphone: [
    { header: "User-Agent", operation: "set", value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1" },
    { header: "Sec-CH-UA", operation: "remove" },
    { header: "Sec-CH-UA-Mobile", operation: "remove" },
    { header: "Sec-CH-UA-Platform", operation: "remove" },
  ],
};

async function getSettings() {
  const { finder = true, phoneMode = false, device = "android" } =
    await chrome.storage.local.get(["finder", "phoneMode", "device"]);
  return { finder, phoneMode, device: device in HEADERS ? device : "android" };
}

async function apply() {
  const { finder, phoneMode, device } = await getSettings();

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE_ID],
    addRules: phoneMode
      ? [{
          id: RULE_ID,
          priority: 1,
          action: { type: "modifyHeaders", requestHeaders: HEADERS[device] },
          // Page loads (main_frame) are only matched when listed explicitly.
          condition: { requestDomains: ["sabbar.com"], resourceTypes: RESOURCE_TYPES },
        }]
      : [],
  });

  const ids = [FINDER_ID, PHONE_ID];
  const registered = await chrome.scripting.getRegisteredContentScripts({ ids });
  if (registered.length) await chrome.scripting.unregisterContentScripts({ ids: registered.map((s) => s.id) });

  const common = { matches: MATCHES, runAt: "document_start", world: "MAIN", persistAcrossSessions: true };
  const scripts = [];
  if (finder) scripts.push({ ...common, id: FINDER_ID, js: ["finder.js"] });
  if (phoneMode) scripts.push({ ...common, id: PHONE_ID, js: [`devices/${device}.js`, "spoof.js"], allFrames: true });
  if (scripts.length) await chrome.scripting.registerContentScripts(scripts);
}

chrome.runtime.onInstalled.addListener(apply);
chrome.runtime.onStartup.addListener(apply);
chrome.storage.onChanged.addListener(apply);
