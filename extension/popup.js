const enabledBox = document.getElementById("enabled");
const deviceSelect = document.getElementById("device");
const SABBAR = /^https?:\/\/([^/]+\.)?sabbar\.com(\/|:|$)/;

async function reloadSabbarTabs() {
  // Give the background worker a moment to swap the rules, then reload.
  setTimeout(async () => {
    const tabs = await chrome.tabs.query({ url: "*://*.sabbar.com/*" });
    for (const tab of tabs) chrome.tabs.reload(tab.id, { bypassCache: true });
  }, 300);
}

(async () => {
  const { enabled = true, device = "android" } = await chrome.storage.local.get(["enabled", "device"]);
  enabledBox.checked = enabled;
  deviceSelect.value = device;
})();

enabledBox.addEventListener("change", async () => {
  await chrome.storage.local.set({ enabled: enabledBox.checked });
  reloadSabbarTabs();
});

deviceSelect.addEventListener("change", async () => {
  await chrome.storage.local.set({ device: deviceSelect.value });
  reloadSabbarTabs();
});

// A real narrow window, for sites that also check the screen width.
document.getElementById("phoneWindow").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url && SABBAR.test(tab.url) ? tab.url : "https://sabbar.com/";
  await chrome.windows.create({ url, type: "popup", width: 430, height: 900 });
  window.close();
});
