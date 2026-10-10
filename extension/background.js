// Keeps the header rewrite and the injected script in sync with the popup settings.
const MATCHES = ["*://*.sabbar.com/*"];
const SCRIPT_ID = "sabbar-skipper-spoof";
const RULE_ID = 1;

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
  const { enabled = true, device = "android" } = await chrome.storage.local.get(["enabled", "device"]);
  return { enabled, device: device in HEADERS ? device : "android" };
}

async function apply() {
  const { enabled, device } = await getSettings();

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE_ID],
    addRules: enabled
      ? [{
          id: RULE_ID,
          priority: 1,
          action: { type: "modifyHeaders", requestHeaders: HEADERS[device] },
          condition: { requestDomains: ["sabbar.com"] },
        }]
      : [],
  });

  const registered = await chrome.scripting.getRegisteredContentScripts({ ids: [SCRIPT_ID] });
  if (registered.length) await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
  if (enabled) {
    await chrome.scripting.registerContentScripts([{
      id: SCRIPT_ID,
      matches: MATCHES,
      js: [`devices/${device}.js`, "spoof.js"],
      runAt: "document_start",
      world: "MAIN",
      allFrames: true,
      persistAcrossSessions: true,
    }]);
  }
}

chrome.runtime.onInstalled.addListener(apply);
chrome.runtime.onStartup.addListener(apply);
chrome.storage.onChanged.addListener(apply);
