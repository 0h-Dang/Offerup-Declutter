// Background service worker — minimal, just keeps extension alive
chrome.runtime.onInstalled.addListener(() => {
  console.log('OfferUp Filter installed.');
});
