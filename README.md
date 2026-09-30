# MAKE.EXE — poster tool

Makes the "I am invited" post the guests share before MAKE.EXE in New York
(Huge × DDX): drop in a photo, type a name, download a 1080 × 1350 PNG.

Live at **huge.fastforward.global** — a FastForward subdomain, so neither Huge
nor DDX has to touch DNS for it.

The invitation it belongs to is **huge.ddxconference.com**; every colour, face
and photograph here was read off that page.

## One night, no pickers

The tour tools this was adapted from (DDX, Footprint Intelligence, HESH) list
several events, or several kinds of visitor, and lock every field until one is
chosen. This is one evening and one guest list, so:

- `assets/js/editions.js` exports a single `THE_EVENT` constant,
- `assets/js/variant.js` is a single constant too — no Attendee / Speaker /
  Exhibitor picker, because a room of thirty invited guests has nothing to tell
  apart,
- nothing is gated: every field is live from the first paint.

Change the date, the city or the tint in `editions.js` and nothing else needs
touching.

## Running it

```bash
node serve.mjs      # http://localhost:8800
```

No build step, no dependencies. Static files and ES modules; the server exists
only because ES modules will not load over `file://`.

## Publishing

```bash
./deploy.sh
```

Force-pushes the mirror, creates the repository and the Pages site on first run,
turns on **Enforce HTTPS**, and stamps every module import with the commit so a
change is never half-cached in someone's browser.

## Brand

Read off huge.ddxconference.com:

| | |
|---|---|
| Ink | `#050505` |
| Accent | `#FF31A1` (Huge pink) |
| Dim | `#9A9A9A` |
| Type | **Anton** (headline) + **Space Mono** (facts) + **Inter** (everything else) |

All three faces are open-licence and self-hosted, so the poster renders
identically offline and a canvas export can never race a font request.

Which face does what is the whole of the type direction. **Anton** sets the
headline and nothing else — it is a single-weight display face and deliberately
the loudest thing on the poster, so a name set in it would out-shout the event.
**Space Mono** carries the date line, which is the invitation's own voice for
facts. **Inter** takes the name and the role, where a weight rather than a shape
does the work.

### The pink is used once

The other three tools lay their accent over the whole poster as a multiply wash.
This one washes **only the photograph** (`tintScope: 'background'` in
`poster.js`). Multiply with magenta collapses the green channel, so an
all-over wash turns the white type pink and the poster loses the thing the
invitation is built on: near-black, white, and pink used exactly once.

## The two marks

Which mark sits where is the layout:

- **MAKE.EXE** takes the title line, in place of type. It is the evening's name
  set better than a typeface could set it here. Held at 470px against artwork
  that is 492px wide, so it is always drawn down rather than up — the letters
  are outlines, and a hairline goes soft the moment it is upscaled.
- **Huge** takes the footer and is the whole of it — no caption over the mark,
  no URL opposite it. Huge's is also the only logo on the poster; DDX curates
  the room but does not appear. Drawn *after* the brand wash, so a partner's
  logo never picks up someone else's colour cast.

  `L.hostLabel` is an empty string rather than deleted, because `drawHostMark`
  still reads it — putting a caption back is one word.

## Changing the pictures

Drop a portrait file into `assets/img/bg/` and name it in `manifest.json`.
Shoot or crop **1080 × 1350 or larger**; the poster darkens the lower half
heavily for the type, so the subject should sit in the top two thirds.

The five on offer come from the invitation page — one of New York, four from the
first MAKE.EXE in Los Angeles:

| file | what it is |
|---|---|
| `midtown.jpg` | Midtown at golden hour, the hero of the invitation |
| `the-room.jpg` | the stage in Los Angeles, lit pink |
| `round-one.jpg` | round one on the screens |
| `the-floor.jpg` | the installation, mid-competition |
| `mezzanine.jpg` | guests on the mezzanine |

`midtown.jpg` is 914 × 1600 and is scaled up 1.18× to fill the canvas — the only
one below full size, and not visibly so. The three neutral gradients behind them
are the same abstracts DDX and Footprint offer.

Without any photograph the poster still works — it draws a tinted gradient with
a faint waveform across it, using the event's `tint`.

## Known gaps

- **The motion backgrounds are generic**, carried over from the other tools:
  abstract light, particles and depth, none of them New York and none of them
  branded. Real footage from the room is a file drop plus a manifest line.
- **Not indexed**, by `robots.txt` and a `noindex` meta, so it does not compete
  with the invitation at huge.ddxconference.com in search.
- **No role labels.** `assets/js/variant.js` keeps the shape for an eyebrow
  above the headline, so a "SPEAKER" or "JURY" line is one constant away if the
  night ever wants one.

## Not shared with anything

DDX, Footprint, HESH and this are four separate folders and four separate
repositories. They share no files. A fix made here reaches none of the others,
and that is deliberate: three of them are live and in use.
