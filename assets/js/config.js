/* ==========================================================================
   SMALL BATCH – editable content
   Everything the bar team will want to change lives here. No build step:
   edit, save, redeploy. Only short dashes (–) in copy, never em dashes.
   ========================================================================== */
window.SB_CONFIG = {

  /* ----------------------------------------------------------------------
     SMALL BATCH CLUB – mirrors the concept. Source of truth:
     small-batch/src/data/club.json + CLAUDE.md + PITCH-KLUB.md (2026-10-25):
       · Medlem 995 / Stamgæst 1.995 / Bryggerens bord 3.995 kr. (proposal,
         not agreed with Small Batch yet)
       · 2027 opens Nº 001–150 (the founders), all 300 from 2028
       · guest tickets 0 / 1 / 2 – only for Første tap and Klubaftenen
       · pre-sale = the founders' list; numbers go in sign-up order
     ---------------------------------------------------------------------- */
  joinUrl: "https://small-batch-koncept.vercel.app/klubben/stifterlisten/",   // ?fra=<placement> is added per button
  clubUrl: {
    da: "https://small-batch-koncept.vercel.app/klubben/",
    en: "https://small-batch-koncept.vercel.app/en/club/"
  },
  club: {
    year: 2027,
    cap: 300,
    table: 30,          // Nº 001–030 = Bryggerens bord
    founders: 150,      // 2027 opens Nº 001–150
    nextYear: 2028,     // Nº 151–300
    tiers: [
      { id: "medlem", price: 995,
        name: { da: "Medlem", en: "Member" },
        one: { da: "Velkomstpakken, dit nummer og Klubaftenen i juni", en: "The welcome pack, your number and the Club Night in June" },
        guest: 0 },
      { id: "stamgaest", price: 1995,
        name: { da: "Stamgæst", en: "Regular" },
        one: { da: "Alt i Medlem – og klubøl i marts, juni og november", en: "Everything in Member – and club beer in March, June and November" },
        guest: 1 },
      { id: "bord", price: 3995, seats: 30,
        name: { da: "Bryggerens bord", en: "The Brewer's Table" },
        one: { da: "Alt i Stamgæst – og bryggedagen med Johnny · kun 30 pladser", en: "Everything in Regular – and brew day with Johnny · only 30 seats" },
        guest: 2 }
    ],
    evenings: [
      { m: 3, for: ["stamgaest", "bord"], name: { da: "Første tap", en: "First Tap" } },
      { m: 6, for: ["medlem", "stamgaest", "bord"], name: { da: "Klubaftenen", en: "The Club Night" } },
      { m: 9, for: ["bord"], name: { da: "Bryggedagen", en: "Brew Day" } },
      { m: 11, for: ["bord"], name: { da: "Julesmagningen", en: "The Christmas Tasting" } }
    ]
  },

  /* Opening hours are NOT published – keep every day null (concept rule:
     never state hours). */
  hours: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 0: null },

  /* ----------------------------------------------------------------------
     VIDEO SLOTS – drop Higgsfield renders into /assets/video/ and set src.
     The Batch Films section stays hidden until at least one film has a src.
     See HIGGSFIELD.md.
     ---------------------------------------------------------------------- */
  videos: {
    hero: { src: "", srcMobile: "", byTime: null },
    club: { src: "" },
    films: [
      { src: "", poster: "assets/img/bar-pour.avif" },
      { src: "", poster: "assets/img/sunset-drinks.avif" },
      { src: "", poster: "assets/img/lightstrip.avif" }
    ]
  },

  /* ----------------------------------------------------------------------
     THE BOARD – house range, light to dark. Notes follow the brewery's own
     descriptions (small-batch/src/data/beers.json); IBU per Untappd.
     % vol. is shown neutrally, never as a selling point.
     tag: "" | "award" | "club"
     ---------------------------------------------------------------------- */
  taps: [
    { name: "Rønne Bækker", style: { da: "Sydtysk pilsner", en: "South German pilsner" }, notes: { da: "Crisp, balanceret bitterhed og velhumlet.", en: "Crisp, balanced bitterness, well hopped." }, abv: 5.0, ibu: 23, color: "#f3d36b" },
    { name: "No. 1", style: { da: "American pale ale", en: "American pale ale" }, notes: { da: "Et godt bid fra humlen, uden at det bliver overdøvende.", en: "A good bite of hops, never overpowering." }, abv: 4.8, ibu: 28, color: "#e9b04a" },
    { name: "Every Day IPA", style: { da: "Frugtig hverdags-IPA", en: "Fruity everyday IPA" }, notes: { da: "Tørhumlet med amerikanske humler. Bitterheden i kort snor.", en: "Dry-hopped with American hops. Bitterness on a short leash." }, abv: 5.6, ibu: 40, color: "#f0a630" },
    { name: "Krush IPA", style: { da: "India pale ale", en: "India pale ale" }, notes: { da: "Tropiske frugtnoter og et strejf af citrus.", en: "Tropical fruit and a touch of citrus." }, abv: 5.8, ibu: 51, color: "#eb9a2a" },
    { name: "Havtorn", style: { da: "Pale ale med havtorn", en: "Sea buckthorn pale ale" }, notes: { da: "Havtornbær fra Høstet. Let syrlig, masser af citrus.", en: "Sea buckthorn from Høstet. Lightly tart, plenty of citrus." }, abv: 5.5, ibu: 36, color: "#f08a24" },
    { name: "Back in Black", style: { da: "Dark India ale", en: "Dark India ale" }, notes: { da: "De mørke maltes kaffe møder Cascade-humlens citrus.", en: "Dark-malt coffee meets Cascade citrus." }, abv: 6.3, ibu: 49, color: "#22160f", tag: "award", award: { da: "Delt 6. plads, Årets Ølnyhed 2018", en: "Shared 6th, New Danish Beer of the Year 2018" } },
    { name: "Klubbens batch", style: { da: "Medlemmerne først", en: "Members first" }, notes: { da: "Når en klubbatch kommer på hanen, får medlemmerne førsteret.", en: "When a club batch goes on tap, members get first call." }, abv: 0, ibu: 0, color: "#ff5500", tag: "club", locked: true }
  ],

  /* EVENTS (shown under Find os). date = ISO; past events are muted. */
  events: [
    {
      date: null, club: true, label: { da: "Marts 2027", en: "March 2027" },
      title: { da: "Small Batch Club: Første tap", en: "Small Batch Club: First Tap" },
      text: { da: "Årets første klubbatch bliver tappet i Nexø – for Stamgæst og Bryggerens bord.", en: "The year's first club batch is tapped in Nexø – for Regulars and the Brewer's Table." },
      url: "#club"
    },
    {
      date: "2026-09-17T20:00:00+02:00",
      title: { da: "Klippeøens Comedy Club", en: "Klippeøens Comedy Club" },
      text: { da: "Stand-up ved havnen.", en: "Stand-up on the harbour." },
      url: "https://musikhuzet.dk/kalender/klippeoeens-comedy-club-small-batch-bar/"
    },
    {
      date: "2026-07-04T13:00:00+02:00",
      title: { da: "Officiel åbning", en: "Official opening" },
      text: { da: "Musik og gåsehud på Nexø Havn.", en: "Music and goosebumps on Nexø harbour." },
      url: "https://www.tv2bornholm.dk/bornholm/abning-giver-medejer-gasehud-og-mere-ol-til-nexo-ef1d0"
    }
  ],

  social: {
    instagram: "https://www.instagram.com/smallbatchnexo",
    facebook: "https://www.facebook.com/smallbatchnexo"
  },

  directions: "https://www.google.com/maps/dir//Nordre+Strandvej+6,+3730+Nex%C3%B8,+Denmark/@55.065748,15.1326994,17z"
};
