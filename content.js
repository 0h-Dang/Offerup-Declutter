(() => {
  if (window.__ouFilterActive) return;
  window.__ouFilterActive = true;

  // ── Settings ──────────────────────────────────────────────────────────────
  let settings = {
    filterDuplicates: true,
    filterFinancing: true,
    filterDealers: true,
    filterAds: true,
    pushAdsDown: true,
    promotedFirst: false,
    priceCompare: true,
    mode: 'dim',
  };

  // ── Financing patterns (English + Spanish) ────────────────────────────────
  const FINANCING_PATTERNS = [
    /\$\s*0\b/, /\$\s*1\b/, /\bone\s+dollar\b/i,
    /\bfinanc/i, /\blease[\s-]?to[\s-]?own\b/i,
    /\bno\s+credit\b/i, /\bbuy\s+now\s+pay\s+later\b/i,
    /\brent[\s-]?to[\s-]?own\b/i, /\blow\s+monthly\b/i,
    /\bweekly\s+payment/i, /\bown\s+it\s+today/i,
    /\b0\s*%\s*(apr|interest|down)/i,
    /\btake\s+it\s+home\s+today/i,
    /\bapply\s+(now|online|today)\b/i,
    /\beveryone\s+(gets\s+)?approved/i,
    /\bno\s+credit\s+check\b/i,
    /\bpayment\s+plan/i, /\bin[\s-]?store\s+financ/i,
    /\bgood\s+credit/i, /\bbad\s+credit/i,
    /\$0\s*down/i, /zero\s+down/i,
    /\bdown\s+payment/i, /\bmonthly\s+pay/i,
    /\bno\s+money\s+down/i,
    // Spanish
    /\benganche\b/i,
    /\bsin\s+cr[eé]dito\b/i,
    /\bcr[eé]dito\b/i,
    /\bfinanciamiento\b/i,
    /\bno\s+licen[cs]ia\b/i,
    /\baplica[rn]?\b/i,
    /\baprobado[s]?\b/i,
    /\bsemanal(es)?\b/i,
    /\bmensual(es)?\b/i,
    /\bsin\s+inicial\b/i,
    /\btodos\s+aprobados\b/i,
    /\bcon\s+pasaporte\b/i,
    /\bitin\b/i,
    /\bgarant[ií]a\b/i,
    /\bpagos?\b/i,
  ];

  const BRAND_NAMES = [
    'acima', 'snap finance', 'progressive leasing', 'flexshopper',
    'koalafi', 'uown', 'paytomorrow', 'tempoe', 'rent-a-center',
    'rentacenter', "aaron's", 'aarons', 'rent2own',
  ];
  const BRAND_RE = new RegExp(
    BRAND_NAMES.map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i'
  );

  function isFinancing(text) {
    if (!text) return false;
    return FINANCING_PATTERNS.some(p => p.test(text)) || BRAND_RE.test(text);
  }

  // ── Image key ─────────────────────────────────────────────────────────────
  function imgKey(url) {
    if (!url || url.startsWith('data:')) return null;
    try {
      const parts = new URL(url).pathname.split('/').filter(Boolean);
      return parts.slice(-2).join('/').toLowerCase().split('?')[0];
    } catch {
      return url.split('?')[0].toLowerCase();
    }
  }

  // ── Price extraction ──────────────────────────────────────────────────────
  function extractPrice(text) {
    const m = text.match(/\$\s*([\d,]+)/);
    if (!m) return null;
    const n = parseFloat(m[1].replace(/,/g, ''));
    return isNaN(n) || n <= 1 ? null : n;
  }

  // ── State — no user data stored, all session-only ─────────────────────────
  const seenImgs   = new Map();   // imgKey → card el (this tab session only)
  const dismissed  = new Set();   // card els user manually restored
  const pricesByTitle = new Map();// normalizedTitle → [price, ...]
  const stats = { total: 0, duplicates: 0, financing: 0, dealers: 0, ads: 0 };

  // ── Promoted detection ────────────────────────────────────────────────────
  function isPromoted(card) {
    const text = card.textContent || '';
    if (/\bpromoted\b/i.test(text)) return true;
    if (card.querySelector('[class*="promot" i], [data-testid*="promot" i]')) return true;
    return false;
  }

  // ── Overlay ───────────────────────────────────────────────────────────────
  function addOverlay(card, label, type) {
    if (dismissed.has(card)) return;

    if (card.dataset.ouFiltered) {
      const ov = card.querySelector('.ou-filter-overlay');
      if (ov && !ov.querySelector(`.ou-badge-${type}`)) {
        const b = document.createElement('span');
        b.className = `ou-filter-badge ou-badge-${type}`;
        b.textContent = label;
        ov.insertBefore(b, ov.querySelector('.ou-filter-restore'));
      }
      return;
    }

    card.dataset.ouFiltered = type;
    card.style.position = 'relative';

    const ov = document.createElement('div');
    ov.className = 'ou-filter-overlay';

    const badge = document.createElement('span');
    badge.className = `ou-filter-badge ou-badge-${type}`;
    badge.textContent = label;
    ov.appendChild(badge);

    const btn = document.createElement('button');
    btn.className = 'ou-filter-restore';
    btn.textContent = 'show';
    btn.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      dismissed.add(card);
      card.classList.remove('ou-filter-dim', 'ou-filter-hide', 'ou-filter-ad');
      ov.style.display = 'none';
      sendStats();
    });
    ov.appendChild(btn);
    card.appendChild(ov);

    applyMode(card, type);
    sendStats();
  }

  function addAdBadge(card) {
    if (card.dataset.ouAdBadged) return;
    card.dataset.ouAdBadged = '1';
    card.style.position = 'relative';

    // Hide OfferUp's own "Promoted" label — replace with ours
    card.querySelectorAll('[class*="promot" i]').forEach(el => {
      el.style.visibility = 'hidden';
    });

    const ov = document.createElement('div');
    ov.className = 'ou-filter-overlay';

    const badge = document.createElement('span');
    badge.className = 'ou-filter-badge ou-badge-ad';
    badge.textContent = 'Ad';
    ov.appendChild(badge);

    const btn = document.createElement('button');
    btn.className = 'ou-filter-restore';
    btn.textContent = 'show';
    btn.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      dismissed.add(card);
      card.classList.remove('ou-filter-dim', 'ou-filter-ad');
      ov.style.display = 'none';
      sendStats();
    });
    ov.appendChild(btn);
    card.appendChild(ov);

    if (settings.filterAds) {
      card.classList.add('ou-filter-ad');
    }

    stats.ads++;
    sendStats();
  }

  function applyMode(card, type) {
    if (dismissed.has(card)) return;
    if (type === 'ad') {
      card.classList.add('ou-filter-ad');
      return;
    }
    if (settings.mode === 'hide') {
      card.classList.add('ou-filter-hide');
      card.classList.remove('ou-filter-dim');
    } else {
      card.classList.add('ou-filter-dim');
      card.classList.remove('ou-filter-hide');
    }
  }

  // ── Push ads to bottom of their grid container ────────────────────────────
  function reorderAds() {
    if (!settings.pushAdsDown || settings.promotedFirst) return;
    document.querySelectorAll('[data-ou-ad-badged]').forEach(card => {
      if (dismissed.has(card)) return;
      const parent = card.parentElement;
      if (parent) parent.appendChild(card);
    });
  }

  function reorderAdsFirst() {
    if (!settings.promotedFirst) return;
    document.querySelectorAll('[data-ou-ad-badged]').forEach(card => {
      const parent = card.parentElement;
      if (parent) parent.prepend(card);
    });
  }

  // ── Price compare ─────────────────────────────────────────────────────────
  function normTitle(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
  }

  function registerPrice(card, title, price) {
    if (!settings.priceCompare || !price) return;
    const key = normTitle(title);
    if (!key) return;
    if (!pricesByTitle.has(key)) pricesByTitle.set(key, []);
    pricesByTitle.get(key).push({ price, card });
  }

  function runPriceCompare() {
    if (!settings.priceCompare) return;
    pricesByTitle.forEach((entries) => {
      if (entries.length < 2) return;
      const prices = entries.map(e => e.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      if (max <= min * 1.15) return; // less than 15% difference, skip
      entries.forEach(({ price, card }) => {
        if (dismissed.has(card)) return;
        if (price > min * 1.15) {
          // Add price-high badge without dimming
          if (!card.querySelector('.ou-badge-price')) {
            const ov = card.querySelector('.ou-filter-overlay') || (() => {
              const o = document.createElement('div');
              o.className = 'ou-filter-overlay';
              card.style.position = 'relative';
              card.appendChild(o);
              return o;
            })();
            const b = document.createElement('span');
            b.className = 'ou-filter-badge ou-badge-price';
            b.textContent = `↑ vs $${Math.round(min)}`;
            b.title = `Cheapest similar: $${Math.round(min)}`;
            ov.appendChild(b);
          }
        }
      });
    });
  }

  // ── Card finder ───────────────────────────────────────────────────────────
  function findCards() {
    const cards = new Set();

    // Walk up from each listing link to the tightest single-listing container.
    // Key guard: the chosen container must have exactly 1 listing link inside —
    // never a grid/section wrapper that holds multiple cards.
    document.querySelectorAll('a[href*="/item/detail/"]').forEach(a => {
      let el = a;
      for (let i = 0; i < 6; i++) {
        el = el.parentElement;
        if (!el || el === document.body || el === document.documentElement) break;
        const linkCount = el.querySelectorAll('a[href*="/item/detail/"]').length;
        if (linkCount > 1) break; // overshot into a wrapper — stop
        if (linkCount === 1 && el.querySelector('img')) {
          cards.add(el);
          break;
        }
      }
    });

    // Backup: explicit selectors with same single-link guard
    document.querySelectorAll([
      '[data-testid*="listing"]', '[data-testid*="item"]',
      '[class*="ListingCard"]', '[class*="listing-card"]',
      '[class*="ItemCard"]', '[class*="item-card"]',
    ].join(',')).forEach(el => {
      const linkCount = el.querySelectorAll('a[href*="/item/detail/"]').length;
      if (el.querySelector('img') && linkCount === 1) cards.add(el);
    });

    return cards;
  }

  // ── Process card ──────────────────────────────────────────────────────────
  function processCard(card) {
    if (card.dataset.ouProcessed) return;
    card.dataset.ouProcessed = '1';
    stats.total++;

    const text = card.innerText || card.textContent || '';
    const img  = card.querySelector('img');
    const src  = img?.src || img?.dataset?.src || '';
    const key  = imgKey(src);
    const price = extractPrice(text);

    // Promoted / Ad
    if (isPromoted(card)) {
      card.dataset.ouAdBadged = '1';
      addAdBadge(card);
      if (settings.pushAdsDown) setTimeout(reorderAds, 100);
      if (settings.promotedFirst) setTimeout(reorderAdsFirst, 100);
      // Still run other checks on ads (they can also be duplicates/financing)
    }

    // Financing in visible text
    if (settings.filterFinancing && isFinancing(text)) {
      stats.financing++;
      addOverlay(card, 'financing', 'financing');
    }

    // Duplicate image
    if (settings.filterDuplicates && key) {
      if (seenImgs.has(key)) {
        if (!card.dataset.ouFiltered) stats.duplicates++;
        addOverlay(card, 'duplicate', 'duplicate');
      } else {
        seenImgs.set(key, card);
      }
    }

    // Dealer
    if (settings.filterDealers && !card.dataset.ouFiltered) {
      if (text.includes('Verified Local Business') || BRAND_RE.test(text)) {
        stats.dealers++;
        addOverlay(card, 'dealer', 'dealer');
      }
    }

    // Register for price compare
    const titleEl = card.querySelector('h2, h3, [class*="title" i], [class*="name" i]');
    const title = titleEl?.textContent?.trim() || text.slice(0, 80);
    if (price) registerPrice(card, title, price);

    // Background description fetch for unflagged cards only
    if (!card.dataset.ouFiltered) {
      const link = card.querySelector('a[href*="/item/detail/"]');
      if (link?.href) {
        const href = link.href;
        setTimeout(async () => {
          if (card.dataset.ouFiltered) return;
          try {
            const res = await fetch(href, { credentials: 'omit', cache: 'no-store' });
            // Only read text, never store the response beyond this scope
            const html = await res.text();
            const raw = html.replace(/<[^>]+>/g, ' ');
            if (isFinancing(raw)) {
              stats.financing++;
              addOverlay(card, 'financing', 'financing');
            } else if (settings.filterDealers && BRAND_RE.test(raw)) {
              stats.dealers++;
              addOverlay(card, 'dealer', 'dealer');
            }
          } catch { /* network error — skip silently */ }
        }, 600 + Math.random() * 1000);
      }
    }
  }

  // ── Scan ──────────────────────────────────────────────────────────────────
  function scan() {
    findCards().forEach(processCard);
    setTimeout(runPriceCompare, 1500);
  }

  let scanTimer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, 350);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // ── Stats — no personal data, counts only ────────────────────────────────
  function sendStats() {
    chrome.runtime.sendMessage({
      type: 'STATS_UPDATE',
      stats: { ...stats, dismissed: dismissed.size },
    }).catch(() => {});
  }

  // ── Messages from popup ───────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg, _sender, respond) => {
    if (msg.type === 'GET_STATS') {
      respond({ stats: { ...stats, dismissed: dismissed.size }, settings });
      return true;
    }

    if (msg.type === 'UPDATE_SETTINGS') {
      const prev = { ...settings };
      settings = { ...settings, ...msg.settings };
      // Persist only non-identifying settings
      chrome.storage.sync.set({ ouFilterSettings: settings });

      // Re-apply modes to flagged cards
      document.querySelectorAll('[data-ou-filtered]').forEach(c => {
        if (dismissed.has(c)) return;
        applyMode(c, c.dataset.ouFiltered);
      });

      // Ad visibility toggle
      document.querySelectorAll('[data-ou-ad-badged]').forEach(c => {
        if (dismissed.has(c)) return;
        if (settings.filterAds) c.classList.add('ou-filter-ad');
        else c.classList.remove('ou-filter-ad');
      });

      // Reorder ads if toggle changed
      if (settings.pushAdsDown && !prev.pushAdsDown) reorderAds();
      if (settings.promotedFirst && !prev.promotedFirst) reorderAdsFirst();
    }

    if (msg.type === 'RESTORE_ALL') {
      document.querySelectorAll('[data-ou-filtered], [data-ou-ad-badged]').forEach(c => {
        dismissed.add(c);
        c.classList.remove('ou-filter-dim', 'ou-filter-hide', 'ou-filter-ad');
        const ov = c.querySelector('.ou-filter-overlay');
        if (ov) ov.style.display = 'none';
      });
      sendStats();
    }
  });

  // ── Init — load settings from storage, never transmit them ───────────────
  chrome.storage.sync.get('ouFilterSettings', result => {
    if (result.ouFilterSettings) {
      // Only accept known keys — ignore anything unexpected
      const allowed = Object.keys(settings);
      const safe = {};
      allowed.forEach(k => {
        if (k in result.ouFilterSettings) safe[k] = result.ouFilterSettings[k];
      });
      settings = { ...settings, ...safe };
    }
    setTimeout(scan, 800);
    setTimeout(scan, 2500);
  });

})();
