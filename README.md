# Sabbar Skipper

A small Chrome / Edge extension that makes **sabbar.com** think your PC browser is a phone, so it stops pushing you to the mobile app and lets you browse and apply from your computer.

## How it works

Sites decide "desktop or phone?" from a handful of signals. On `sabbar.com` only, the extension changes all of them:

| Signal | What the extension does |
| --- | --- |
| `User-Agent` / `Sec-CH-UA-*` request headers | Rewritten to an Android (or iPhone) browser |
| `navigator.userAgent`, `platform`, `vendor`, `userAgentData` | Overridden before any site script runs |
| Touch checks (`maxTouchPoints`, `ontouchstart`) | Reports a touch screen |
| `matchMedia('(pointer: coarse)')`, `(hover: none)` | Answers like a phone |
| Screen width | The **"Open Sabbar in a phone-sized window"** button opens a real narrow window |

Every other website is left alone.

## Install (about 1 minute)

1. Download this repo (green **Code** button → **Download ZIP**) and unzip it.
2. Open `chrome://extensions` (or `edge://extensions` in Edge).
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `extension` folder.
5. Pin the extension and open https://sabbar.com.

## Using it

- Click the extension icon to turn it on or off, or switch between **Android** and **iPhone**. Open Sabbar tabs reload automatically.
- If Sabbar still shows "download the app" or a QR code:
  1. Switch the phone type (iPhone ↔ Android).
  2. Click **Open Sabbar in a phone-sized window**. Some sites also check the screen width.
  3. Log out and back in. Some sites remember "desktop" in your session.

## If it still doesn't work

If the apply button exists **only inside the native app** (no mobile-website version at all), faking a phone in the browser can't help. Your options then:

- **Run the Android app on your PC:** Google Play Games for PC (if Sabbar is listed), BlueStacks, or Android Studio's emulator.
- **Mirror your phone to your PC** and use your mouse and keyboard: [scrcpy](https://github.com/Genymobile/scrcpy) (free, Android) or Windows **Phone Link**.

## Quick test without installing anything

Chrome DevTools can do a rough version of this: press `F12`, then `Ctrl+Shift+M` (device toolbar), pick a phone such as *Pixel 7*, and reload. If Sabbar lets you apply that way, the extension will too, and it stays on without DevTools open.
