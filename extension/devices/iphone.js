// Runs in the page right before spoof.js and tells it which phone to pretend to be.
self.__sabbarSkipperDevice = {
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1",
  platform: "iPhone",
  vendor: "Apple Computer, Inc.",
  maxTouchPoints: 5,
  uaData: null, // Safari has no navigator.userAgentData
};
