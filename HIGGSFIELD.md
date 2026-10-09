# Higgsfield video pack – Small Batch Nexø

The site ships with **designed fallbacks in every video slot** (live WebGL beer, Ken Burns film reels),
so nothing looks empty today. When the Higgsfield account has credits, render the clips below,
drop the files in `assets/video/`, and set the paths in `assets/js/config.js → videos`.

**Budget:** Seedance 2.0 at 1080p is ~72 credits per 8 s clip (quoted 9 Oct 2026).
The full pack (7 clips) is roughly **500 credits**. The account currently has 0 credits.

**House style for every prompt:** warm blaze-orange (#FF5500) and deep amber against near-black,
35 mm film grain, shallow depth of field, no on-screen text, no logos, no audio.

> **Consent:** do not image-to-video photos that show identifiable people (the bartender) unless
> they've agreed to be animated by AI. The prompts below use text-to-video for people shots and only
> feed non-identifying photos as start frames. Club-section rules from the concept apply: no
> `bar-pour`/`sunset-drinks` there, no amounts, nothing "free".

| Slot | Config key | Format | Model / settings |
|---|---|---|---|
| Hero (desktop) | `videos.hero.src` | 16:9, 10 s, seamless loop | `seedance_2_5`, t2v, 1080p, `generate_audio: false` |
| Hero (phone) | `videos.hero.srcMobile` | 9:16, 10 s, loop | same |
| Hero by time of day (optional) | `videos.hero.byTime.{morning,day,dusk,night}` | 16:9, 10 s | same |
| Club background | `videos.club.src` | 16:9, 10 s, loop | `seedance_2_5`, omni_reference with `lightstrip.avif` |
| Batch Film Nº 01 – Skænket | `videos.films[0].src` | 21:9, 9 s | `seedance_2_5`, t2v |
| Batch Film Nº 02 – Havnen | `videos.films[1].src` | 21:9, 9 s | `seedance_2_5`, start frame `sunset-drinks.avif` (silhouettes) |
| Batch Film Nº 03 – Klubben | `videos.films[2].src` | 21:9, 9 s | `seedance_2_5`, t2v |

Export as H.264 MP4, ≤ 6 MB for the hero and ≤ 8 MB for the films (HandBrake "Web optimized", CRF 24–26).

---

## 1. Hero: "The Pour, from inside" (the WebGL texture behind the letters)

This video becomes the live texture the visitor sees through the SMALL BATCH letters. The shader
then adds bubbles, a cursor ripple and the scroll zoom on top, so keep the shot calm and abstract.

```
Extreme macro, slow motion, inside a glass of amber IPA. Endless streams of fine bubbles rise
through backlit golden-orange beer; a few larger bubbles wobble upward and catch specular
highlights. Near the top a soft foam line shimmers. Deep amber and blaze-orange palette, edges
falling off to near-black, shallow depth of field, gentle 35mm film grain. Locked-off camera,
no cuts, perfectly seamless loop. No text, no logos, no hands, no glass rim visible.
```

**Phone (9:16):** same prompt + `vertical composition, bubbles rising the full height of the frame`.

**Time-of-day variants (optional, swaps by Copenhagen time):**
- *morning*: `…cool Baltic morning light refracting through the beer, pale gold with a hint of steel blue`
- *dusk*: `…low golden-hour sun behind the glass, saturated orange, long lens flare`
- *night*: `…lit only by a vertical orange neon strip behind the glass, deep shadows, glowing bubbles`

## 2. Club background: "Small Batch Club"

Start frame: `assets/img/lightstrip.avif` (no people). Mode `omni_reference`, role `image_references`.

```
A dim industrial bar at night on a Baltic fishing harbour, after closing time. Raw concrete pillar
with a vertical orange neon light tube, slow dolly forward toward it, light haze in the air. On a
ledge in front of the tube stands a turned wooden bottle. Warm orange and ink-black palette, heavy
35mm grain, quiet and intimate. No people, no text.
```

## 3. Batch Film Nº 01: "Skænket" (The Pour)

```
Cinematic 21:9. A tap handle is pulled; amber beer cascades into a tilted pint glass in slow
motion, foam blooming and rising to the rim, droplets catching warm tungsten light, colourful
bokeh of bottles behind the bar. Close-up on hands and glass only, no faces. Subtle handheld
drift, 35mm film look, warm orange grade.
```

## 4. Batch Film Nº 02: "Havnen" (The Harbour)

Start frame: `assets/img/sunset-drinks.avif` (silhouettes only).

```
Two silhouettes raise wine-shaped beer glasses against a glowing orange wall and clink them in
slow motion; droplets spray and catch the light; the light slowly shifts warmer like a setting
sun over a harbour. Silhouettes only, 35mm grain, 21:9 cinematic.
```

## 5. Batch Film Nº 03: "Klubben" (The Club)

```
Cinematic 21:9, night. A matte-black member card with an orange foil number slides across a dark
wooden bar top under a single orange light; beside it a turned wooden bottle with a number burned
into the wood. Slow push-in, deep blacks, orange highlights, 35mm film grain. No faces, no text.
```

---

### Wiring it up

```js
// assets/js/config.js
videos: {
  hero:  { src: "assets/video/hero-16x9.mp4", srcMobile: "assets/video/hero-9x16.mp4", byTime: null },
  club:  { src: "assets/video/club.mp4" },
  films: [
    { src: "assets/video/film-01-skaenket.mp4", poster: "assets/img/bar-pour.avif" },
    { src: "assets/video/film-02-havnen.mp4",   poster: "assets/img/sunset-drinks.avif" },
    { src: "assets/video/film-03-klubben.mp4",  poster: "assets/img/red-woman.avif" }
  ]
}
```

Visitors with *reduced motion* switched on always get the still fallbacks, and the hero video pauses
when it's scrolled off screen.
