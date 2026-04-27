'use strict';

let currentSettings = {
  filterDuplicates: true,
  filterFinancing:  true,
  filterDealers:    true,
  filterAds:        true,
  pushAdsDown:      true,
  promotedFirst:    false,
  priceCompare:     true,
  mode: 'dim',
};

function getActiveTab(cb) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    if (tab && tab.url && tab.url.includes('offerup.com')) {
      cb(tab);
    } else {
      document.getElementById('main-ui').style.display = 'none';
      document.getElementById('no-page').style.display = 'block';
    }
  });
}

function updateStats(s) {
  if (!s) return;
  document.getElementById('s-total').textContent     = s.total     ?? '0';
  document.getElementById('s-dups').textContent      = s.duplicates ?? '0';
  document.getElementById('s-fin').textContent       = s.financing  ?? '0';
  document.getElementById('s-dealers').textContent   = s.dealers    ?? '0';
  document.getElementById('s-ads').textContent       = s.ads        ?? '0';
  document.getElementById('s-dismissed').textContent = s.dismissed  ?? '0';
}

function applySettings() {
  getActiveTab(tab => {
    chrome.tabs.sendMessage(tab.id, {
      type: 'UPDATE_SETTINGS',
      settings: currentSettings,
    });
  });
}

function setMode(mode) {
  currentSettings.mode = mode;
  document.getElementById('mode-dim').classList.toggle('active', mode === 'dim');
  document.getElementById('mode-hide').classList.toggle('active', mode === 'hide');
  applySettings();
}

function restoreAll() {
  getActiveTab(tab => {
    chrome.tabs.sendMessage(tab.id, { type: 'RESTORE_ALL' });
  });
}

// Wire up all toggles
const TOGGLE_MAP = {
  'chk-dups':   'filterDuplicates',
  'chk-fin':    'filterFinancing',
  'chk-dealers':'filterDealers',
  'chk-ads':    'filterAds',
  'chk-push':   'pushAdsDown',
  'chk-pfirst': 'promotedFirst',
  'chk-price':  'priceCompare',
};

Object.entries(TOGGLE_MAP).forEach(([id, key]) => {
  document.getElementById(id).addEventListener('change', e => {
    currentSettings[key] = e.target.checked;
    // promotedFirst and pushAdsDown are mutually exclusive
    if (key === 'promotedFirst' && e.target.checked) {
      currentSettings.pushAdsDown = false;
      document.getElementById('chk-push').checked = false;
    }
    if (key === 'pushAdsDown' && e.target.checked) {
      currentSettings.promotedFirst = false;
      document.getElementById('chk-pfirst').checked = false;
    }
    applySettings();
  });
});

// Init: pull current state from content script
getActiveTab(tab => {
  chrome.tabs.sendMessage(tab.id, { type: 'GET_STATS' }, response => {
    if (chrome.runtime.lastError || !response) return;
    updateStats(response.stats);
    if (response.settings) {
      currentSettings = { ...currentSettings, ...response.settings };
      Object.entries(TOGGLE_MAP).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) el.checked = !!currentSettings[key];
      });
      setMode(currentSettings.mode);
    }
  });
});

// Live updates while popup is open
chrome.runtime.onMessage.addListener(msg => {
  if (msg.type === 'STATS_UPDATE') updateStats(msg.stats);
});
