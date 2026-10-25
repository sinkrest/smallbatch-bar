# Small Batch Nexø – website

A one-page site for **Small Batch**, the experimental brewery and bar at Ndr. Strandvej 6, Nexø Havn, Bornholm.
It is tied into the **Small Batch Club** concept (`website-uplifts/small-batch`, live at
https://small-batch-koncept.vercel.app/klubben/): same member card, same three memberships, same welcome pack,
and every join button links straight to the club page.

Static HTML/CSS/JS, no build step. GSAP, ScrollTrigger and Lenis are vendored in `assets/vendor/`, so there are no CDN or Google calls.

## What's on the page (rebuilt 2026-10-25 after a three-reviewer UX pass)

| # | Section | What it does |
|---|---|---|
| – | **The door** | The SMALL BATCH lettering fills with beer, then an 18+ gate. Returning visitors are through in under half a second. Deep links (`/#club`) land on their section after the gate. |
| – | **Hero** | One WebGL pass: beer, bubbles, cursor ripple and the logo cut-out from a signed distance field. Scrolling dives into a letter, then "No boring beer." lands. Bottom right: "Small Batch Club · 150 numre i 2027 ↓". |
| 01 | Manifest | The bar's own text, revealed word by word. |
| 02 | **Small Batch Club** | <ul><li>"150 numre. Skriv dig op først." with the 300-mark board (001–030 the table, 031–150 open in 2027, 151–300 in 2028)</li><li>the kit under one light: the concept's member card, the wooden bottle with »Nº 047 · 2027« burned in, Batch 01/02 and the tee's chest print. Visitors try a number (001–150) and a name.</li><li>the price ladder (995 / 1.995 / 3.995 kr., guest tickets, the 30 table seats)</li><li>the four evenings</li><li>ONE button to Stifterlisten, with the honest concept line</li></ul> |
| 03 | On tap | House beers from light to dark, in the brewery's own words, % vol. and IBU neutral. Split-flap names; hovering pours the beer into a floating glass. |
| 04 | The harbour | A pinned sideways gallery on desktop, a swipe row on phones. |
| 05 | Find os | The address as headline, the Bornholm map and the calendar (past events muted). |
| – | Footer | Dark, with the wordmark lit orange like the light tube. |

**Phones:** a sticky "Skriv mig op" bar (hidden in the hero, at the club's own button and on the footer), the join button in the header at every width, and the language switch in the menu.

**Batch Films** stays hidden until a Higgsfield film is set in `config.js → videos.films`.

**Sign-up tracking:** every button goes to `joinUrl` with its own `?fra=` (`bar-header`, `bar-sticky`, `bar-club`, `bar-footer`). Stifterlisten stores that as the source.

**Links:** `?lang=da` / `?lang=en` forces the language.

**QA:** `node tools/shot.mjs <url> <outdir> 1440 900` and `… 390 844 mobile` save headless screenshots (still mode: `?still=1` skips the door, reduced motion lays out the pinned parts).

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
- `joinUrl` (Stifterlisten) and `club` (tiers with one-line summaries, prices, guest tickets, founders 150 / 300, evenings; mirrors the concept's `club.json` + `CLAUDE.md`)
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
