const SETTINGS = { finder: true, phoneMode: false, device: "android" };
const SABBAR = /^https?:\/\/([^/]+\.)?sabbar\.com(\/|:|$)/;

function reloadSabbarTabs() {
  // Give the background worker a moment to swap the scripts, then reload.
  setTimeout(async () => {
    const tabs = await chrome.tabs.query({ url: "*://*.sabbar.com/*" });
    for (const tab of tabs) chrome.tabs.reload(tab.id, { bypassCache: true });
  }, 300);
}

(async () => {
  const stored = await chrome.storage.local.get(Object.keys(SETTINGS));
  for (const [key, fallback] of Object.entries(SETTINGS)) {
    const el = document.getElementById(key);
    const value = stored[key] ?? fallback;
    if (el.type === "checkbox") el.checked = value; else el.value = value;
    el.addEventListener("change", async () => {
      await chrome.storage.local.set({ [key]: el.type === "checkbox" ? el.checked : el.value });
      reloadSabbarTabs();
    });
  }
})();

// A real narrow window, for sites that also check the screen width.
document.getElementById("phoneWindow").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url && SABBAR.test(tab.url) ? tab.url : "https://sabbar.com/";
  await chrome.windows.create({ url, type: "popup", width: 430, height: 900 });
  window.close();
});
