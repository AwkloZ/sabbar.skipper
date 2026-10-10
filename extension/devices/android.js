// Runs in the page right before spoof.js and tells it which phone to pretend to be.
self.__sabbarSkipperDevice = {
  userAgent:
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  platform: "Linux armv8l",
  vendor: "Google Inc.",
  maxTouchPoints: 5,
  uaData: {
    brands: [
      { brand: "Chromium", version: "130" },
      { brand: "Google Chrome", version: "130" },
      { brand: "Not?A_Brand", version: "99" },
    ],
    platform: "Android",
    platformVersion: "14.0.0",
    model: "Pixel 8",
    fullVersion: "130.0.0.0",
  },
};
