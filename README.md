# Sabbar Skipper

A Chrome / Edge extension that cuts out Sabbar's "register with your phone → download the app → get sent to another site" routine.

On Sabbar, **Apply** usually just sends you on to the company's careers page or another job board. That link is often already in the job page's data. Sabbar Skipper finds it and shows it in a small panel at the bottom-left of the job page:

> **Direct apply link found** &nbsp; `[Open ↗]` careers.company.com/job/… `[Copy]`

One click, and you're on the real application page on your PC. No registration popup, no app.

## Install (about 1 minute)

1. Download this repo (green **Code** button → **Download ZIP**) and unzip it.
2. Open `chrome://extensions` (or `edge://extensions` in Edge).
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `extension` folder.
5. Open any Sabbar job, e.g. `https://sabbar.com/en/jobs/.../id-...`.

If you already installed an older version, click the ↻ reload icon on the extension's card in `chrome://extensions`.

## What the panel tells you

| Panel says | Meaning |
| --- | --- |
| **Direct apply link found** | Click **Open ↗**. This is where Sabbar would eventually have sent you. |
| **N apply links on this page** | You're probably on a page that lists several jobs. Open the specific job first. |
| **No direct apply link found** | Sabbar didn't include the link in the page. It may only send it after you log in. Check **Other outside links**, which shows every non-Sabbar link found. |

The panel ignores Sabbar's own links, app store links, social media, images and analytics. Close it with ×.

## Phone mode (optional, off by default)

The extension popup also has **Pretend to be a phone**. It makes sabbar.com think your browser is an Android phone or an iPhone, and has a button to open Sabbar in a phone-sized window. Use it only if Sabbar ever hides something from desktop browsers. It does **not** remove the registration popup, which is a login wall and not a phone check.

## About the "You appear to be outside Saudi" warning

That's Sabbar guessing your location from your internet connection. It's common on a VPN, or when your provider's IP is registered abroad. The warning itself doesn't block a +966 number. If you do want to register, turning off any VPN usually makes it go away.

## How it works (for the curious)

`extension/finder.js` runs on sabbar.com before the site's own code. It reads the job data the page already receives: the embedded Next.js data, streamed page data, and API responses. In that data it looks for outside links stored under names like `applyUrl`, `externalUrl` or `redirect_url`, or pointing at known job sites (Workday, Greenhouse, Lever, Bayt, LinkedIn Jobs, Jadarat, Google Forms…). Background "prefetch" requests for *other* jobs are ignored, so the link you see belongs to the job you're on. Nothing is sent anywhere. Everything stays in your browser.
