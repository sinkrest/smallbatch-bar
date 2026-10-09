# Small Batch Nexø – website

A one-page site for **Small Batch**, the experimental brewery and bar at Ndr. Strandvej 6, Nexø Havn, Bornholm.
It is tied into the **Small Batch Club** concept (`website-uplifts/small-batch`, live at
https://small-batch-koncept.vercel.app/klubben/): same member card, same three memberships, same welcome pack,
and every join button links straight to the club page.

Static HTML/CSS/JS, no build step. GSAP, ScrollTrigger and Lenis are vendored in `assets/vendor/`, so there are no CDN or Google calls.

## What's on the page

| # | Section | What it does |
|---|---|---|
| – | **The door** | The SMALL BATCH lettering fills with beer, then an 18+ gate (remembered). |
| – | **Hero** | One WebGL pass draws the beer, rising bubbles, a cursor ripple and the logo cut-out (from a signed distance field, so it stays crisp at any zoom). Scrolling dives into a letter, then "No boring beer." lands. |
| 01 | Manifest | The bar's manifesto, revealed word by word, with photo pills. |
| 02 | On tap | House beers from light to dark. % vol. and IBU are shown neutrally. Names flip in; hovering pours the beer into a floating glass. |
| 03 | The harbour | A pinned, horizontally scrolling photo gallery. |
| 04 | **Small Batch Club** | "Lille. Med vilje." with: <ul><li>the number picker</li><li>the concept's matte-black member card with the foil Nº</li><li>the wooden bottle the number burns into</li><li>the welcome pack shelf and the tee with its live chest print</li><li>Medlem / Stamgæst / Bryggerens bord</li><li>the four club evenings</li></ul> Every CTA opens the concept's club page. |
| 05 | Batch Films | Three reels: Higgsfield videos when they exist, a cinematic photo sequence until then. |
| 06 | Events | Driven by config. Past events are struck through. |
| 07 | Find us | Bornholm drawn from OpenStreetMap, plus the facts. |
| – | Footer | A sticky orange reveal of the logo. |

## Rules carried over from the club concept

- **Fonts:** Instrument Sans and Rokkitt only (OFL, self-hosted). The bar's Lovely Mess and FK Grotesk are licensed and are not used. The SMALL BATCH lettering appears only as the SVG wordmark, which is art.
- **Dashes:** only short dashes (–), never em dashes.
- **Alcohol:** % vol. is shown neutrally, never as a selling point. No "strong", no amounts, no "gratis".
- **Photos:**
  - `hug-nexo` and `red-woman` are deselected and removed.
  - The club section uses neither `bar-pour` nor `sunset-drinks`.
- **Hours:** opening hours are never stated, because they aren't published. Leave `hours` as `null`.
- **The Nº sign:** it is built as `N` plus a small underlined `o`, because the fonts have no U+2116.
- **Honesty:** the club section says it is a concept proposal and not a real club yet.

## Editing

Everything editable is in **`assets/js/config.js`**:
- `clubUrl` (DA/EN)
- `club` (tiers, prices, evenings; mirrors the concept's `club.json`)
- `taps`
- `events`
- `videos`

When the club gets its real domain, change `clubUrl`.

## Performance notes

- The hero is a single WebGL draw with a pixel budget: about 2.4 MP on desktop and 1.1 MP on phones, with the texture downscaled to 1920 px. It sleeps when off screen.
- No full-screen blend modes and no backdrop blurs. The club spotlight is a pre-painted gradient that only moves with `transform`.
- Marquees, the club spotlight and the films sleep off screen. The cursor and the pint glass only update when something changes.

## Videos

See [HIGGSFIELD.md](HIGGSFIELD.md).

## Credits

- Photos, the logo lettering and the manifesto © Small Batch.
- Club renders (wooden bottle, club beers, tee) and the evening photos come from the Small Batch Club concept. All pack images are sketches.
- Map data © OpenStreetMap contributors.
- Beer facts are from Untappd.
