// Finds the real application link (company careers page, another job board, a form...)
// buried in a Sabbar job page, and shows it in a small panel so you can open it directly
// instead of registering and going through the app.
(() => {
  if (window.top !== window) return;

  const STRONG = 5; // score at which a link is treated as "the apply link"
  const found = new Map(); // href -> { href, key, score, seen }

  // ---------- Which links count ----------

  const IGNORED_HOST = /(^|\.)(sabbar\.com|apple\.com|gstatic\.com|googleapis\.com|googletagmanager\.com|google-analytics\.com|googlesyndication\.com|doubleclick\.net|facebook\.com|facebook\.net|fb\.com|instagram\.com|twitter\.com|x\.com|t\.co|tiktok\.com|snapchat\.com|youtube\.com|youtu\.be|whatsapp\.com|wa\.me|t\.me|telegram\.me|sentry\.io|sentry-cdn\.com|hotjar\.com|clarity\.ms|w3\.org|schema\.org|onelink\.me|app\.link|branch\.io|page\.link|cloudfront\.net|amazonaws\.com|cloudflare\.com|jsdelivr\.net|unpkg\.com|intercom\.io|intercomcdn\.com|segment\.io|mixpanel\.com|amplitude\.com)$/i;
  const ASSET = /\.(png|jpe?g|gif|svg|webp|avif|ico|css|m?js|woff2?|ttf|otf|eot|mp4|webm|mp3|map)(\?|#|$)/i;
  const APPLY_WORDS = /apply|application|تقديم|تقدم|قدّم|قدم/i;
  const URL_KEY_WORDS = /external|redirect|career|original|source|job_?url|joburl|link|href/i;
  const NOT_APPLY_KEY = /logo|image|img|avatar|icon|photo|banner|thumb|cover|website|site|social|sameas|twitter|facebook|instagram|linkedin|privacy|terms/i;
  const JOB_SITES = /(myworkdayjobs|workday|greenhouse\.io|lever\.co|smartrecruiters|successfactors|taleo|oraclecloud|bamboohr|zohorecruit|workable|recruitee|teamtailor|jobvite|icims|bayt\.com|indeed\.|linkedin\.com\/jobs|jadarat|taqat|naukrigulf|gulftalent|tanqeeb|wuzzuf|glassdoor|forms\.gle|docs\.google\.com\/forms|forms\.office\.com|typeform)/i;
  const JOB_PATH = /apply|career|job|vacanc|recruit|hiring|position|opening|وظ/i;

  function ignored(url) {
    const host = url.hostname;
    if (host === "docs.google.com" || host === "forms.gle") return false;
    if (/(^|\.)google\.[a-z.]+$/i.test(host)) return true;
    if (/(^|\.)linkedin\.com$/i.test(host) && !/\/jobs/i.test(url.pathname)) return true;
    return IGNORED_HOST.test(host) || ASSET.test(url.pathname);
  }

  function score(key, href) {
    let s = 1;
    if (APPLY_WORDS.test(key)) s += 6;
    if (URL_KEY_WORDS.test(key)) s += 3;
    if (NOT_APPLY_KEY.test(key)) s -= 4;
    if (JOB_SITES.test(href)) s += 4;
    if (JOB_PATH.test(href)) s += 2;
    return s;
  }

  function add(raw, key) {
    let url;
    try { url = new URL(raw.replace(/&amp;/g, "&")); } catch (_) { return; }
    if (!/^https?:$/.test(url.protocol) || ignored(url)) return;
    const href = url.href;
    const s = score(key || "", href);
    const prev = found.get(href);
    if (prev && prev.score >= s) { prev.seen = Date.now(); return; }
    found.set(href, { href, key: key || "", score: s, seen: Date.now() });
    scheduleRender();
  }

  // ---------- Where links come from ----------

  const PAIR = /"([\w$.-]{1,40})"\s*:\s*"(https?:\/\/[^"\s<>]+)"/g;
  const HREF = /href\s*=\s*"(https?:\/\/[^"\s<>]+)"/gi;

  // Works on JSON, Next.js page data and streamed (escaped) payloads alike.
  function scanText(text) {
    if (!text || text.length > 8e6) return;
    const t = text
      .replace(/\\u002[fF]/g, "/").replace(/\\u0026/g, "&").replace(/\\u0022/g, '"')
      .replace(/\\+"/g, '"').replace(/\\+\//g, "/");
    for (const m of t.matchAll(PAIR)) add(m[2], m[1]);
    for (const m of t.matchAll(HREF)) add(m[1], "href");
  }

  const scannedScripts = new WeakSet();
  function scanDom() {
    for (const s of document.querySelectorAll("script:not([src])")) {
      if (scannedScripts.has(s)) continue;
      scannedScripts.add(s);
      scanText(s.textContent);
    }
    for (const a of document.querySelectorAll('a[href^="http"]')) {
      if (a.closest("#sabbar-skipper-panel")) continue;
      add(a.href, (a.textContent || "").trim().slice(0, 60) || "link");
    }
  }

  // Next.js prefetches other jobs in the background; those responses belong to other jobs.
  function isPrefetch(input, init) {
    try {
      const h = new Headers((init && init.headers) || (input instanceof Request ? input.headers : undefined));
      return h.get("next-router-prefetch") === "1" || h.get("purpose") === "prefetch";
    } catch (_) { return false; }
  }

  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    const promise = originalFetch.apply(this, arguments);
    if (!isPrefetch(input, init)) {
      promise.then((res) => {
        if (/json|text|x-component/i.test(res.headers.get("content-type") || "")) {
          res.clone().text().then(scanText, () => {});
        }
      }, () => {});
    }
    return promise;
  };

  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function () {
    this.addEventListener("load", () => {
      try {
        if (this.responseType === "" || this.responseType === "text") scanText(this.responseText);
        else if (this.responseType === "json") scanText(JSON.stringify(this.response));
      } catch (_) {}
    });
    return originalSend.apply(this, arguments);
  };

  // ---------- Page changes (Sabbar navigates without full reloads) ----------

  let lastUrl = location.href;
  let hidden = false;
  setInterval(() => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    hidden = false;
    // Keep only what arrived right before this navigation (the new page's own data).
    const cutoff = Date.now() - 4000;
    for (const [href, c] of found) if (c.seen < cutoff) found.delete(href);
    scanDom();
    scheduleRender();
  }, 500);

  let domTimer;
  const observer = new MutationObserver(() => {
    clearTimeout(domTimer);
    domTimer = setTimeout(scanDom, 700);
  });
  document.addEventListener("DOMContentLoaded", () => {
    scanDom();
    observer.observe(document.body, { childList: true, subtree: true });
  });

  // ---------- The panel ----------

  let renderTimer;
  function scheduleRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(render, 300);
  }

  const isJobPage = () => /\/jobs\/.*\bid-[0-9a-f-]{8,}/i.test(location.pathname);
  const label = (href) => {
    const u = new URL(href);
    return u.hostname.replace(/^www\./, "") + (u.pathname.length > 1 ? u.pathname : "");
  };
  const esc = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  let host, root;
  function render() {
    if (!document.body) return;
    const all = [...found.values()].sort((a, b) => b.score - a.score);
    const strong = all.filter((c) => c.score >= STRONG);
    if (hidden || (!strong.length && !isJobPage())) {
      if (host) host.remove();
      return;
    }

    if (!host || !host.isConnected) {
      host = document.createElement("div");
      host.id = "sabbar-skipper-panel";
      root = host.attachShadow({ mode: "open" });
      document.body.appendChild(host);
    }

    let body;
    if (strong.length === 1) {
      body = `<div class="title">Direct apply link found</div>${linkRow(strong[0], true)}`;
    } else if (strong.length > 1) {
      body = `<div class="title">${strong.length} apply links on this page</div>
        <div class="note">On a list page, open the job itself first.</div>
        ${strong.slice(0, 6).map((c) => linkRow(c, false)).join("")}`;
    } else {
      body = `<div class="title">No direct apply link found</div>
        <div class="note">Sabbar may only reveal it after you log in.</div>`;
    }
    const others = all.filter((c) => c.score < STRONG);
    if (others.length) {
      body += `<details><summary>Other outside links (${others.length})</summary>
        ${others.slice(0, 15).map((c) => linkRow(c, false)).join("")}</details>`;
    }

    root.innerHTML = `<style>${CSS}</style>
      <div class="panel" dir="ltr"><button class="x" title="Hide">×</button>${body}</div>`;
    root.querySelector(".x").onclick = () => { hidden = true; host.remove(); };
    root.querySelectorAll("[data-copy]").forEach((b) => {
      b.onclick = () => navigator.clipboard.writeText(b.dataset.copy).then(() => { b.textContent = "Copied"; });
    });
  }

  function linkRow(c, primary) {
    return `<div class="row">
      <a class="${primary ? "open primary" : "open"}" href="${esc(c.href)}" target="_blank" rel="noopener noreferrer">Open ↗</a>
      <span class="url" title="${esc(c.href)}">${esc(label(c.href))}</span>
      <button class="copy" data-copy="${esc(c.href)}">Copy</button>
    </div>`;
  }

  const CSS = `
    .panel { position: fixed; left: 16px; bottom: 16px; z-index: 2147483647; width: 340px; max-width: calc(100vw - 32px);
      max-height: 60vh; overflow: auto; box-sizing: border-box; padding: 12px 14px; border-radius: 12px;
      background: #fff; color: #1a1a1a; font: 13px/1.4 system-ui, sans-serif; box-shadow: 0 6px 24px rgba(0,0,0,.18);
      border: 1px solid #e5e5e5; }
    .title { font-weight: 600; font-size: 14px; margin: 0 20px 6px 0; }
    .note { color: #666; font-size: 12px; margin-bottom: 6px; }
    .row { display: flex; align-items: center; gap: 8px; margin: 6px 0; }
    .url { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #444; }
    .open { flex: none; padding: 4px 10px; border-radius: 6px; background: #eef6f2; color: #0b7a53; text-decoration: none; font-weight: 600; }
    .open.primary { background: #0b7a53; color: #fff; }
    .copy { flex: none; border: 1px solid #ddd; background: #fff; border-radius: 6px; padding: 3px 8px; font: inherit; color: #444; cursor: pointer; }
    .x { position: absolute; top: 6px; right: 8px; border: 0; background: none; font-size: 18px; color: #888; cursor: pointer; }
    details { margin-top: 6px; } summary { cursor: pointer; color: #666; font-size: 12px; }
    @media (prefers-color-scheme: dark) {
      .panel { background: #202124; color: #e8eaed; border-color: #3c4043; }
      .note, summary, .url { color: #9aa0a6; } .copy { background: #2b2c2f; border-color: #3c4043; color: #e8eaed; }
      .open { background: #1e3a2f; color: #7fd3b0; }
    }`;
})();
