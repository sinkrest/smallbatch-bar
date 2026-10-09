/* ==========================================================================
   SMALL BATCH — editable content
   Everything the bar team will want to change lives here. No build step:
   edit, save, redeploy.
   ========================================================================== */
window.SB_CONFIG = {

  /* Where membership applications are POSTed (JSON). Leave empty for demo
     mode: the form animates and shows success but nothing is sent anywhere.
     Works with e.g. Formspree ("https://formspree.io/f/xxxx"), a Make/Zapier
     webhook, or a Higgsfield website DB endpoint. */
  formEndpoint: "",

  /* Invite codes that turn the member card gold (case-insensitive). */
  inviteCodes: ["MEREIPA", "NOBORINGBEER", "NEXOHAVN"],

  /* Founding membership counter — PLACEHOLDER numbers, set your own. */
  club: { name: "Hane 21", seatsTotal: 300, seatsTaken: 53, season: "2026/27" },

  /* Next members-only cellar release (ISO date). null hides the countdown.
     PLACEHOLDER — set a real date. */
  nextRelease: "2026-11-06T19:00:00+01:00",

  /* Opening hours. One entry per weekday (0 = Sunday). null = closed.
     While every day is null the site treats hours as "not published yet"
     (no fake open/closed state). Example: 5: ["15:00", "24:00"]. */
  hours: {
    1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 0: null
  },

  /* ----------------------------------------------------------------------
     VIDEO SLOTS — drop Higgsfield renders into /assets/video/ and set src.
     Every slot has a designed fallback, so empty slots never look broken.
       hero   → used as the live WebGL texture behind the SMALL BATCH letters
                (16:9, 8–10s seamless loop, no audio, ≤ 6 MB mp4/h264)
       club   → background loop in the Society section (dark, moody)
       films  → the three "Batch Films" reels (21:9 or 16:9)
     See HIGGSFIELD.md for the exact prompts.
     ---------------------------------------------------------------------- */
  videos: {
    /* hero can also swap by local time: { morning, day, dusk, night } */
    hero: { src: "", srcMobile: "", byTime: null },
    club: { src: "" },
    films: [
      { src: "", poster: "assets/img/bar-pour.avif" },
      { src: "", poster: "assets/img/sunset-drinks.avif" },
      { src: "", poster: "assets/img/red-woman.avif" }
    ]
  },

  /* ----------------------------------------------------------------------
     THE BOARD — a selection of the house range (styles/ABV/IBU per Untappd).
     ibu drives the bitterness meter. tag: "core" | "award" | "strong" | "members"
     Swap in whatever is actually pouring.
     ---------------------------------------------------------------------- */
  taps: [
    { name: "No. 1", style: { da: "American Pale Ale", en: "American Pale Ale" }, notes: { da: "Husets første. Citrus, brød, nem at holde af.", en: "The house's first. Citrus, bread, easy to love." }, abv: 4.8, ibu: 28, color: "#e9a53a", tag: "core" },
    { name: "Every Day IPA", style: { da: "American IPA", en: "American IPA" }, notes: { da: "Til hver dag. Også mandag.", en: "For every day. Even Monday." }, abv: 5.6, ibu: 40, color: "#f0a630", tag: "core" },
    { name: "Back in Black", style: { da: "Black IPA", en: "Black IPA" }, notes: { da: "Sort som natten, humlet som en IPA. Nr. 6 af 1.825 nye danske øl i 2018.", en: "Black as night, hopped like an IPA. 6th of 1,825 new Danish beers in 2018." }, abv: 6.3, ibu: 49, color: "#22160f", tag: "award" },
    { name: "Havtorn", style: { da: "Pale Ale med havtorn", en: "Sea buckthorn pale ale" }, notes: { da: "Syrlig, frisk og lidt vild — som kysten.", en: "Tart, fresh and a bit wild — like the coast." }, abv: 5.5, ibu: 36, color: "#f08a24", tag: "core" },
    { name: "Rønne Bækker", style: { da: "Bohemisk pilsner", en: "Bohemian pilsner" }, notes: { da: "Sprød, bitter, ærlig.", en: "Crisp, bitter, honest." }, abv: 5.0, ibu: 23, color: "#f3d36b", tag: "core" },
    { name: "Coconut Vanilla Inferno", style: { da: "Pastry imperial stout", en: "Pastry imperial stout" }, notes: { da: "Kokos, vanilje og 14 %. Små glas.", en: "Coconut, vanilla and 14%. Small glasses." }, abv: 14, ibu: 40, color: "#140d09", tag: "strong" },
    { name: "Hane 21", style: { da: "Kun medlemmer", en: "Members only" }, notes: { da: "Den hemmelige hane. Vis dit kort i baren.", en: "The secret tap. Show your card at the bar." }, abv: 0, ibu: 0, color: "#ff5500", tag: "members", locked: true }
  ],

  /* ----------------------------------------------------------------------
     EVENTS. date = ISO. past events get struck through automatically.
     ---------------------------------------------------------------------- */
  events: [
    {
      date: "2026-07-04T13:00:00+02:00",
      title: { da: "Officiel åbning", en: "Official opening" },
      text: { da: "Musik, gratis øl og gåsehud på Nexø Havn.", en: "Music, free beer and goosebumps on Nexø harbour." },
      tags: ["Kl. 13–15"],
      url: "https://www.tv2bornholm.dk/bornholm/abning-giver-medejer-gasehud-og-mere-ol-til-nexo-ef1d0",
      img: "assets/img/hug-nexo.avif"
    },
    {
      date: "2026-09-17T20:00:00+02:00",
      title: { da: "Klippeøens Comedy Club", en: "Klippeøens Comedy Club" },
      text: { da: "Stand-up ved havnen. Billetter via Musikhuzet.", en: "Stand-up on the harbour. Tickets via Musikhuzet." },
      tags: ["Comedy", "Kl. 20:00"],
      url: "https://musikhuzet.dk/kalender/klippeoeens-comedy-club-small-batch-bar/",
      img: "assets/img/red-woman.avif"
    },
    {
      date: null, members: true,
      title: { da: "Medlemsaften: Hane 21 åbner", en: "Members' night: Tap 21 opens" },
      text: { da: "Dato og bryg afsløres kun for medlemmer af Hane 21.", en: "Date and brew revealed to Hane 21 members only." },
      tags: ["Hane 21", "TBA"],
      url: "#club",
      img: "assets/img/lightstrip.avif"
    },
    {
      date: null,
      title: { da: "Flere events følger …", en: "More events coming …" },
      text: { da: "Følg med på vores sociale medier. Vi ses.", en: "Follow along on social. See you there." },
      tags: ["Instagram"],
      url: "https://www.instagram.com/smallbatchnexo",
      img: "assets/img/chairs.avif"
    }
  ],

  social: {
    instagram: "https://www.instagram.com/smallbatchnexo",
    facebook: "https://www.facebook.com/smallbatchnexo"
  },

  directions: "https://www.google.com/maps/dir//Nordre+Strandvej+6,+3730+Nex%C3%B8,+Denmark/@55.065748,15.1326994,17z"
};
