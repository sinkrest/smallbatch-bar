/* ==========================================================================
   SMALL BATCH – editable content
   Everything the bar team will want to change lives here. No build step:
   edit, save, redeploy. Only short dashes (–) in copy, never em dashes.
   ========================================================================== */
window.SB_CONFIG = {

  /* ----------------------------------------------------------------------
     SMALL BATCH CLUB – mirrors the concept (small-batch/src/data/club.json).
     The site links out to the club page for picking a number and joining.
     Prices are the concept's proposal – not set yet.
     ---------------------------------------------------------------------- */
  clubUrl: {
    da: "https://small-batch-koncept.vercel.app/klubben/",
    en: "https://small-batch-koncept.vercel.app/en/club/"
  },
  club: {
    year: 2027,
    cap: 300,
    table: 30,               // Nº 001–030 = Bryggerens bord
    tiers: [
      {
        id: "medlem", price: 795,
        name: { da: "Medlem", en: "Member" },
        tag: { da: "Pakken og nummeret", en: "The pack and the number" },
        lines: {
          da: ["Velkomstpakken: træflasken, t-shirten og to klubøl", "Dit nummer i klubåret 2027 – og førsteret til det næste år", "Invitation til Klubaftenen i juni", "Førsteret, når klubbens batches kommer på hanen i baren"],
          en: ["The welcome pack: the wooden bottle, the t-shirt and two club beers", "Your number for club year 2027 – and first right to it next year", "An invitation to the Club Night in June", "First call when the club's batches go on tap at the bar"]
        },
        choose: { da: "Vælg Medlem", en: "Choose Member" }
      },
      {
        id: "stamgaest", price: 1995,
        name: { da: "Stamgæst", en: "Regular" },
        tag: { da: "Marts · juni · november", en: "March · June · November" },
        lines: {
          da: ["Alt i Medlem", "Tre forsendelser med klubøl: marts, juni og november", "To batches hver gang, to flasker af hver – én til nu og én til at gemme", "Første tap i marts og Klubaftenen i juni"],
          en: ["Everything in Member", "Three club-beer shipments: March, June and November", "Two batches each time, two bottles of each – one for now, one to keep", "First Tap in March and the Club Night in June"]
        },
        choose: { da: "Vælg Stamgæst", en: "Choose Regular" }
      },
      {
        id: "bord", price: 3995, seats: 30,
        name: { da: "Bryggerens bord", en: "The Brewer's Table" },
        tag: { da: "Nº 001–030", en: "Nº 001–030" },
        lines: {
          da: ["Alt i Stamgæst – og en fjerde forsendelse i september", "Bryggedagen i september: I brygger bordets batch med Johnny – og siger I ja, kommer jeres navne på etiketten", "Julesmagningen i november – årets julebatch, før den bliver sendt ud", "30 pladser ved bordet"],
          en: ["Everything in Regular – and a fourth shipment in September", "Brew Day in September: you brew the table's batch with Johnny – and if you say yes, your names go on the label", "The Christmas tasting in November – the year's Christmas batch before it ships", "30 seats at the table"]
        },
        choose: { da: "Vælg Bryggerens bord", en: "Choose the Brewer's Table" }
      }
    ],
    evenings: [
      { m: 3, img: "assets/club/ev-barrel-672.webp", for: ["stamgaest", "bord"],
        name: { da: "Første tap", en: "First Tap" },
        text: { da: "Årets første klubbatch bliver tappet i Nexø – og I smager den, før nogen andre gør.", en: "The year's first club batch is tapped in Nexø – and you taste it before anyone else." } },
      { m: 6, img: "assets/club/ev-tasting-700.webp", for: ["medlem", "stamgaest", "bord"],
        name: { da: "Klubaftenen", en: "The Club Night" },
        text: { da: "En sommeraften på havnen for hele klubben. Johnny fortæller om årets batches, og klubben smager tre prøvebryg og stemmer om det næste.", en: "A summer evening on the harbour for the whole club. Johnny talks through the year's batches, and the club tastes three trial brews and votes on the next one." } },
      { m: 9, img: "assets/club/ev-brewers-700.webp", for: ["bord"],
        name: { da: "Bryggedagen", en: "Brew Day" },
        text: { da: "Bryggerens bord brygger årets bordbatch sammen med Johnny – fra malt til gærtank. Siger I ja, kommer jeres navne på etiketten.", en: "The Brewer's Table brews the year's table batch with Johnny – from malt to fermenter. If you say yes, your names go on the label." } },
      { m: 11, img: "assets/club/ev-release-700.webp", for: ["bord"],
        name: { da: "Julesmagningen", en: "The Christmas Tasting" },
        text: { da: "Bordet smager årets julebatch i Nexø, før den bliver sendt ud.", en: "The Table tastes the year's Christmas batch in Nexø before it ships." } }
    ]
  },

  /* Opening hours are NOT published – keep every day null. The site then
     says nothing about open/closed (concept rule: never state hours). */
  hours: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 0: null },

  /* ----------------------------------------------------------------------
     VIDEO SLOTS – drop Higgsfield renders into /assets/video/ and set src.
     Every slot has a designed fallback. See HIGGSFIELD.md.
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
     THE BOARD – house range (style / % vol. / IBU per Untappd), light to
     dark. % vol. is shown neutrally, never as a selling point.
     tag: "core" | "award" | "club"
     ---------------------------------------------------------------------- */
  taps: [
    { name: "Rønne Bækker", style: { da: "Bohemisk pilsner", en: "Bohemian pilsner" }, notes: { da: "Sprød, bitter, ærlig.", en: "Crisp, bitter, honest." }, abv: 5.0, ibu: 23, color: "#f3d36b", tag: "core" },
    { name: "No. 1", style: { da: "American Pale Ale", en: "American Pale Ale" }, notes: { da: "Husets første. Citrus og brød.", en: "The house's first. Citrus and bread." }, abv: 4.8, ibu: 28, color: "#e9a53a", tag: "core" },
    { name: "Every Day IPA", style: { da: "American IPA", en: "American IPA" }, notes: { da: "Til hver dag. Også mandag.", en: "For every day. Even Monday." }, abv: 5.6, ibu: 40, color: "#f0a630", tag: "core" },
    { name: "Havtorn", style: { da: "Pale ale med havtorn", en: "Sea buckthorn pale ale" }, notes: { da: "Syrlig, frisk og lidt vild – som kysten.", en: "Tart, fresh and a bit wild – like the coast." }, abv: 5.5, ibu: 36, color: "#f08a24", tag: "core" },
    { name: "Back in Black", style: { da: "Black IPA", en: "Black IPA" }, notes: { da: "Sort som natten, humlet som en IPA. Nr. 6 af 1.825 nye danske øl i 2018.", en: "Black as night, hopped like an IPA. 6th of 1,825 new Danish beers in 2018." }, abv: 6.3, ibu: 49, color: "#22160f", tag: "award" },
    { name: "Coconut Vanilla Inferno", style: { da: "Pastry imperial stout", en: "Pastry imperial stout" }, notes: { da: "Kokos, vanilje og mørk kakao.", en: "Coconut, vanilla and dark cocoa." }, abv: 14, ibu: 40, color: "#140d09", tag: "core" },
    { name: "Club Batch", style: { da: "Kun for Small Batch Club", en: "Small Batch Club only" }, notes: { da: "Klubbens batches på hanen – medlemmerne får førsteret.", en: "The club's batches on tap – members get first call." }, abv: 0, ibu: 0, color: "#ff5500", tag: "club", locked: true }
  ],

  /* EVENTS. date = ISO; past events are struck through automatically. */
  events: [
    {
      date: "2026-07-04T13:00:00+02:00",
      title: { da: "Officiel åbning", en: "Official opening" },
      text: { da: "Musik og gåsehud på Nexø Havn.", en: "Music and goosebumps on Nexø harbour." },
      tags: ["Kl. 13–15"],
      url: "https://www.tv2bornholm.dk/bornholm/abning-giver-medejer-gasehud-og-mere-ol-til-nexo-ef1d0",
      img: "assets/img/chairs.avif"
    },
    {
      date: "2026-09-17T20:00:00+02:00",
      title: { da: "Klippeøens Comedy Club", en: "Klippeøens Comedy Club" },
      text: { da: "Stand-up ved havnen. Billetter via Musikhuzet.", en: "Stand-up on the harbour. Tickets via Musikhuzet." },
      tags: ["Comedy", "Kl. 20:00"],
      url: "https://musikhuzet.dk/kalender/klippeoeens-comedy-club-small-batch-bar/",
      img: "assets/img/lightstrip.avif"
    },
    {
      date: null, club: true, label: { da: "Marts 27", en: "Mar 27" },
      title: { da: "Small Batch Club: Første tap", en: "Small Batch Club: First Tap" },
      text: { da: "Årets første klubbatch bliver tappet i Nexø – for klubbens medlemmer.", en: "The year's first club batch is tapped in Nexø – for club members." },
      tags: ["Small Batch Club", "2027"],
      url: "#club",
      img: "assets/club/ev-barrel-672.webp"
    },
    {
      date: null,
      title: { da: "Flere events følger …", en: "More events coming …" },
      text: { da: "Følg med på vores sociale medier. Vi ses.", en: "Follow along on social. See you there." },
      tags: ["Instagram"],
      url: "https://www.instagram.com/smallbatchnexo",
      img: "assets/img/no-boring-beer.avif"
    }
  ],

  social: {
    instagram: "https://www.instagram.com/smallbatchnexo",
    facebook: "https://www.facebook.com/smallbatchnexo"
  },

  directions: "https://www.google.com/maps/dir//Nordre+Strandvej+6,+3730+Nex%C3%B8,+Denmark/@55.065748,15.1326994,17z"
};
