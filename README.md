# OfferUp Filter

> A Chrome extension for **informed shoppers** — automatically flags duplicate listings, financing bait, and dealer spam so you can browse smarter without clicking into every single listing.

![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)
![Chrome](https://img.shields.io/badge/Browser-Chrome-yellow.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

---

## Why this exists

Scrolling through OfferUp can feel like wading through noise — the same item listed across a dozen cities, $1 bait prices hiding a lease-to-own scheme, and store accounts dressed up as private sellers. Instead of clicking in and out of listing after listing to figure out what you're actually looking at, this extension surfaces that information right on the browse page.

Duplicates, financing language, and dealer accounts get flagged inline so you can make faster, more informed decisions without losing your place in the feed.

---

## Features

| Badge | What it catches |
|-------|----------------|
| 🔴 **Duplicate** | Same photo URL seen in multiple listings — same seller, different cities |
| 🟡 **Financing** | $1 / $0 bait prices, lease-to-own, "no credit check", buy-now-pay-later language |
| 🟣 **Dealer** | "Verified Local Business" accounts or known financing brands (Acima, Snap Finance, Progressive Leasing, etc.) |
| ⬛ **Ad** | Promoted listings — dimmed, desaturated, and re-labeled so they don't crowd organic results |
| 🟢 **Price** | Badges listings priced higher than the cheapest similar item found on the page |

**English & Spanish pattern detection** — catches sellers who write financing terms in Spanish to avoid standard filters.

**Description scanning** — quietly fetches each listing's detail page in the background. This catches sellers who use clean titles but bury "Finance Available / Everyone Approved" in the description.

---

## Install (takes ~30 seconds)

> No Chrome Web Store required. Loads directly from your machine.

1. [Download this repo](../../archive/refs/heads/main.zip) and unzip it somewhere permanent (Desktop, Documents, etc.)
   — Chrome needs the folder to stay there after install

2. Open Chrome and go to `chrome://extensions`

3. Toggle **Developer mode** ON — top right corner
   > Chrome requires Developer mode to load extensions that aren't from the Web Store — this is normal and safe for locally installed extensions.

4. Click **Load unpacked**

5. Select the `offerup-filter` folder

6. Done — you'll see the **F** icon in your toolbar

---

## How to use

- Browse OfferUp normally — filtering runs automatically as you scroll
- Click the **F icon** in your toolbar to see live stats and toggle individual filters
- Flagged listings are dimmed with a badge overlay
- Each flagged listing has a **Show** button to manually restore it
- Switch between **Dim** (grayed out) and **Hide** (fully removed) in the popup
- Use **Restore all** to undo all filtering on the current page

---

## Filter options

| Option | What it does |
|--------|-------------|
| Duplicate images | Dims listings that share a photo URL with another listing |
| Financing / $1 bait | Dims listings with financing language in title or description |
| Dealer / store accounts | Dims verified business accounts and known financing storefronts |
| Price compare badge | Adds a green badge to listings priced above the cheapest similar item found |
| Dim & badge ads | Desaturates promoted listings and replaces "Promoted" with an "Ad" badge |
| Push ads to bottom | Moves promoted listings to the end of the feed |
| Promoted first | Moves promoted listings to the top (overrides "push to bottom") |

---

## Privacy

All filtering runs **locally in your browser**. No browsing data, search terms, or listing details are collected, stored, or transmitted anywhere. The extension has no analytics, no telemetry, and no external server.

---

## Contributing

Contributions are very welcome — this is an open project built to help everyday shoppers, not a commercial product.

**Good places to start:**

- Adding new financing or dealer keywords (especially Spanish patterns)
- Improving duplicate detection beyond photo URL matching
- Supporting Firefox / Edge (manifest adjustments needed)
- Improving the price comparison logic
- UI polish on the popup

**To contribute:**

1. Fork the repo
2. Create a branch (`git checkout -b feature/your-idea`)
3. Make your changes
4. Open a pull request with a short description of what you changed and why

If you're not sure where to start, open an [Issue](../../issues) describing what you'd like to improve and we can figure it out together.

---

## Roadmap ideas

- [ ] Seller history flagging (repeat offenders across sessions)
- [ ] Configurable keyword lists (let users add their own terms)
- [ ] Firefox support
- [ ] Export flagged listings to CSV
- [ ] Auto-update without reinstalling

---

## Updates

Replace the files in your local folder with the latest from this repo, then click the **refresh icon** on `chrome://extensions`.

---

## License

Released under the [MIT License](LICENSE). Free to use, modify, and distribute. Attribution appreciated but not required.

> Built for informed shoppers everywhere. Not affiliated with OfferUp.
