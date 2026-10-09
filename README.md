# Small Batch Nexø — website

A one-page site for **Small Batch**, the experimental brewery and bar at Ndr. Strandvej 6, Nexø Havn, Bornholm,
with a membership concept called **Hane 21** ("20 taps on the beer altar. The 21st is yours.").

Static HTML/CSS/JS. No build step. GSAP + ScrollTrigger and Lenis come from CDNs.

## What's on the page

| # | Section | What it does |
|---|---|---|
| — | **The door** | A loader where the SMALL BATCH lettering fills with beer, then an 18+ age gate (remembered). |
| — | **Hero** | Live WebGL beer (rising bubbles, cursor ripple) seen *through* the cut-out logo. Scrolling dives into a letter, and "No boring beer." lands. |
| 01 | Manifest | The bar's own manifesto, revealed word by word on scroll, with photo "pills" inline. |
| 02 | On tap | A board of real house beers (style, ABV and IBU per Untappd). Names flip like a ferry departure board. Hovering pours the beer into a floating pint. |
| 03 | The harbour | A pinned, horizontally scrolling gallery of the bar's photos. |
| 04 | **Hane 21** | The club: a spotlight effect, six perks, three tiers (Praktikant → Mellemleder → Bestyrelsen), a 3D holographic member card that updates live as you type, an invite-code door, the application form, and a "Members only" cellar with a countdown. |
| 05 | Batch Films | A 21:9 cinema with three reels. It plays Higgsfield videos once they exist, and a cinematic photo sequence with subtitles until then. |
| 06 | Events | Driven by config. Past events are struck through automatically. |
| 07 | Find us | A drawn coastline of Bornholm (OpenStreetMap data) with Nexø pinging, plus facts and opening hours. |
| — | Footer | A sticky reveal of the giant logo on blaze orange. |

Global touches:
- custom cursor with labels, magnetic buttons, film grain, a velocity-reactive marquee
- a scroll-progress **pint glass** that fills as you read
- DA/EN toggle
- a *Pause motion* button, and full `prefers-reduced-motion` support
- easter eggs: type `ipa` or `kpi`

## Editing content

Everything the team will touch is in **`assets/js/config.js`**:
- `taps`: the beer board
- `events`
- `hours`: leave every day `null` until hours are published, and the site says "hours coming soon" instead of faking open/closed
- `club`: seat counter
- `nextRelease`: countdown
- `inviteCodes`
- `videos`
- `formEndpoint`

Copy is bilingual inline: Danish in the HTML, English in `data-en="…"`.

## ⚠️ Before this goes live on smallbatch.bar

1. **Applications are not collected yet.** `formEndpoint` is empty, so the form runs in demo mode. Point it at Formspree, a Make/Zapier webhook or similar.
2. **Placeholders to confirm:**
   - the Mellemleder price (DKK 995 / season)
   - seats (300 total, 53 taken)
   - `nextRelease` (6 Nov 2026)
   - the invite codes
   - the perk list
   - which beers are actually on the board
3. **Opening hours.** These aren't published anywhere yet. Fill in `hours`.
4. **Fonts.** Lovely Mess and FK Grotesk load from the bar's own Webflow CDN, so the files aren't copied into this repo. Check the font licences cover the new host and domain.
5. **Invite codes are front-end theatre.** They only change the card visually; any real gating needs a server.
6. **Social.** The Instagram/Facebook handles (`smallbatchnexo`) come from the current site's metadata. Make sure the accounts exist.

## Videos

See **[HIGGSFIELD.md](HIGGSFIELD.md)** for the prompt pack, slot sizes and the cost estimate.

## Credits

- Photos, logo lettering and manifesto © Small Batch.
- Map data © OpenStreetMap contributors (ODbL).
- Beer facts are from Untappd and smallbatch.dk.
- Bar facts are from TV2 Bornholm and Bornholm Nyt (July 2026).
