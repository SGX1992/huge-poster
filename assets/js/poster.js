import { ACCENT, DISPLAY_FONT, DISPLAY_WEIGHT, FONT, MONO_FONT, WHITE, capHeight, clamp, drawTracked, drawTrackedReveal, fitSize, mixHex, roundRect } from './brand.js?v=1790810557';
import { background } from './backgrounds.js?v=1790810557';
import { variant } from './variant.js?v=1790810557';
import { backgroundVideo, seek } from './videobg.js?v=1790810557';

export const W = 1080;
export const H = 1350;
export const STILL_LOOP = 8; // only used if a video export ever runs in image mode

/* Exported so the whole layout — spacing, type caps, the brand wash — can be
   nudged from the console while art-directing, without an edit-reload cycle. */
/* The colour that changes nothing for each blend mode. White is neutral for
   multiply; overlay and soft-light pivot around mid-grey instead. */
/* The build-in. Each layer gets a window in the intro, as a fraction of
   INTRO_MS, and fades up while sliding a few pixels into place. The headline is
   deliberately early and the card late, so you watch the card crop into it —
   the layering that makes the poster work is also what it shows you first.

   Exports never see this: main.js calls skipIntro() before rendering. */
const INTRO_MS = 5000;
const NAME_REVEAL_MS = 420; // only the changed tail of the name animates
const BG_FADE_MS = 750; // cross-fade when the edition or the chosen shot changes
const CUE = {
  background: [0.00, 0.34],
  headline:   [0.20, 0.46],
  card:       [0.34, 0.62],
  date:       [0.56, 0.72],
  city:       [0.64, 0.84],
  name:       [0.74, 0.92],
  role:       [0.80, 0.96],
  partners:   [0.80, 0.94],
  logo:       [0.10, 0.34],
  footer:     [0.86, 1.00],
  tint:       [0.40, 1.00],
};

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/* 0 before the cue, 1 after it, eased in between. */
function cue(name, t) {
  const [from, to] = CUE[name];
  if (t >= 1) return 1;
  return easeOut(clamp((t - from) / (to - from), 0, 1));
}

/* Cover-fit onto the poster, anchored slightly above centre. */
function paintCover(c, src, zoom, alpha) {
  if (!src || alpha <= 0) return;
  const iw = src.videoWidth || src.naturalWidth || src.width;
  const ih = src.videoHeight || src.naturalHeight || src.height;
  if (!iw || !ih) return;
  const scale = Math.max(W / iw, H / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const prev = c.globalAlpha;
  c.globalAlpha = prev * alpha;
  c.drawImage(src, (W - dw) / 2, (H - dh) * 0.42, dw, dh);
  c.globalAlpha = prev;
}

/* Draw `body` faded up and nudged into place. p of 1 skips the save/restore
   entirely, so a finished poster costs exactly what it did before the intro
   existed — which matters because a 24-second export runs this 720 times. */
function layer(c, p, rise, body) {
  if (p <= 0) return;
  if (p >= 1) return body();
  c.save();
  c.globalAlpha = p;
  c.translate(0, (1 - p) * rise);
  body();
  c.restore();
}

const NEUTRAL = {
  multiply: '#FFFFFF',
  screen: '#000000',
  overlay: '#808080',
  'soft-light': '#808080',
};

export const L = {
  side: 76,
  headline: 'I AM INVITED',
  headMaxW: 820,
  headTrack: -0.018,
  /* Anton is condensed, so a headline fitted to the full measure would set
     enormous. The cap is chosen so that every headline on offer hits it — the
     longest, "I AM INVITED", still measures 710 of the 820 available at 150 —
     which means all three set at exactly the same size. A poster whose headline
     changes size depending on which words you picked looks like it moved. */
  headCap: 150,
  /* The tour builds crop the card into the headline on purpose — you watch the
     photo slide over the type. This one sits clear of it instead: Anton is
     dense enough that a photograph running through it turns the words into
     texture. Baseline this far above the card's top edge. */
  headGap: 30,
  eyebrowSize: 30,    // the role line above the headline
  eyebrowTrack: 0.42,
  eyebrowGap: 26,
  card: { w: 548, h: 616, r: 28, y: 272 },
  dateGap: 62,        // date baseline above the card's bottom edge
  /* Set in the mono, which is the invitation's voice for facts. A monospace is
     already wide, so it needs far less tracking than a grotesque would to read
     as a spaced-out line — 0.24 here would push it past the measure and fitSize
     would answer by shrinking it. Wider measure, less tracking, same look. */
  dateMaxW: 800,
  dateCap: 40,
  dateTrack: 0.08,
  dateWeight: 700,
  /* The title hangs off the date, not off the card. The two are one thing — the
     event's billing — and measuring from the date's baseline to the title's cap
     height keeps the optical gap between them identical whether the title sets
     at 150 or at 55, which a fixed offset from the card could never do. */
  dateToTitle: 30,
  /* The MAKE.EXE lockup on the title line. Sized by width — it is the widest
     thing on the poster after the headline, and it should read as its equal.
     Held a shade under the artwork's own 492px so it is always drawn down
     rather than up: the letters are outlines, and a hairline that is upscaled
     goes soft before anything else does. */
  titleMarkW: 470,
  markToName: 82,   // name baseline below the lockup's bottom edge
  nameGap: 92,
  nameMaxW: 620,
  nameCap: 74,
  /* The name stays on Inter, not on Anton. Anton is the headline's face and it
     is deliberately the loudest thing here; a name set in it would out-shout
     the event it is going to. Bold Inter is emphatic without competing. */
  nameWeight: 700,
  nameTrack: -0.006,
  /* The optional role-and-company line under the name. Deliberately sized like
     the footer URL rather than like the name — it is an attribution, and at
     name scale it would compete with the person it describes. Left in a dimmed
     white rather than the accent so it stays subordinate to the date. */
  roleGap: 44,        // role baseline below the name baseline
  /* Back to the full measure. This was held at 560 while a "HOSTED BY" caption
     sat opposite at the role's own height; with the caption gone the mark's top
     edge is at 1224 and the role's baseline at 1192, so the two no longer share
     a band and a long job title has the whole width again. */
  roleMaxW: 780,
  roleCap: 28,
  roleTrack: 0.16,
  roleTone: 0.34,     // how far white is pulled toward black
  /* Brand wash: a left-to-right ramp toward the show's red, laid over the finished
     poster so the image and the type sit in one light.

     `tintMode` is a canvas blend mode and `tintStrength` runs 0–1. Each mode has a
     different *neutral* colour — the one that changes nothing — so the ramp is
     built from that colour outward and strength means the same in all of them.
     Getting this wrong is the classic trap: white is neutral for multiply, but in
     overlay white doubles the brightness and blows the left side out.

       multiply    can only ever darken, so contrast survives — this is the one
                   that behaves like a gel over the lens, and it is the default
       soft-light  lifts the shadows as it warms them, which reads as washed out
       overlay     more contrast still, but it turns a blue sky green

     Strength is what keeps multiply usable: at 1 it drags white type all the way
     to yellow, at 0.30 it reads as a warm cast over an image that still has its
     blacks. */
  tintMode: 'multiply',
  tintStrength: 0.34,
  /* 'background', not 'all' — and this is where this build parts company with
     the other three. A red or a yellow laid over the whole poster warms the
     white type without changing what it is. Magenta does not: multiply with
     #FF31A1 collapses the green channel, so white type comes out pink and the
     poster loses the one thing the invitation is built on — near-black, white,
     and pink used exactly once. Washing only the photograph keeps the pink a
     deliberate mark rather than an atmosphere. */
  tintScope: 'background',

  /* The host's mark, centred above the headline. Sized by height, not width, so
     a tall stacked logo and a wide one take the same vertical bite out of the
     space the headline needs.

     What it can grow into is fixed by the speaker build, not the attendee one:
     the SPEAKER eyebrow starts at y=167 where the attendee headline only starts
     at 183. At 34 + 110 the mark ends at 144, which leaves 23px of air under it
     there and 39 here. Growing it further means moving it into the top margin,
     which is already tighter than the 76px at the sides. */
  logoTop: 34,
  logoH: 110,

  partnersTop: 1142,
  /* No URL in the footer any more — the host's mark is the whole of it. This
     stays because the mark is anchored to it, and it is still the line the
     bottom of the poster is measured from. */
  footBase: 1274,
  footTone: 0.45,  // how far the accent is lifted toward white, for the eyebrow
  /* The host's mark. Drawn after the brand wash rather than under it — a
     partner's logo should not pick up someone else's colour cast — and sized
     by height so it sits level with the URL opposite whatever its proportions
     turn out to be. */
  /* Huge's wordmark alone. Sized by height so it sits level with the URL
     opposite whatever its proportions turn out to be. */
  hostMarkH: 58,
  /* No caption over the mark — it stands on its own. Left as an empty string
     rather than deleted because drawHostMark still reads it, so putting a label
     back is one word here. */
  hostLabel: '',
  hostLabelTrack: 0.34,
  hostLabelCap: 20,  // it is fitted to the mark's width; this stops it running large
  hostLabelGap: 16,  // label baseline above the mark's top edge
  hostDrop: 8,       // how far the mark's bottom sits below the footer baseline
};
/* The partner strip runs the full measure between the margins, so a row of
   logos is as large as the poster can make it — derived from `side` rather than
   set by hand, or the two drift the next time the margin moves. */
L.partnersMaxW = W - L.side * 2;

L.card.x = (W - L.card.w) / 2;
L.card.bottom = L.card.y + L.card.h;

export class Poster {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = W;
    this.canvas.height = H;
    this.ctx = this.canvas.getContext('2d');

    this.data = null;
    this.mode = 'image'; // 'image' | 'video'
    this.bg = null; // { image, placeholder } once resolved
    this.bgPrev = null; // held only while a cross-fade is running
    this.bgFade = 0;
    this.video = null;
    this.videoKey = '';
    this.dropActive = false; // a file is hovering over the portrait card
    this.partners = new Map(); // edition id -> logo strip Image, or null
    this.logos = new Map();    // edition id -> top-of-poster mark, or null
    /* Framing is kept as a ratio of the available slack, not pixels, so zooming
       doesn't throw the crop away and one number drives both the drag and the
       slider. -0.25 starts a touch high: on a portrait the face is above centre. */
    this.pan = { x: 0, y: -0.25 };

    this.introStart = 0; // 0 = no intro running, render the finished poster
    this.introKeepsBackground = false;
    this.nameAt = 0;
    this.nameFrom = 0;
    /* Two marks, and which sits where is the point of the layout: the night's
       own lockup takes the title line, and the host takes the foot. */
    this.wordmark = new Image();
    this.wordmark.src = 'assets/img/makeexe.png';
    this.footMark = new Image();
    this.footMark.src = 'assets/img/huge-wordmark.png';
    const settled = (img) => new Promise((r) => { img.onload = r; img.onerror = r; });
    this.wordmarkReady = Promise.all([settled(this.wordmark), settled(this.footMark)]);
  }

  get card() {
    return L.card;
  }

  /* `keepBackground` is for a replay after an edition change: the cross-fade is
     already carrying the image across, so fading the background up from nothing
     as well would blank the poster for a frame before rebuilding it. Everything
     in front of it still deals in exactly as it does on first load. */
  beginIntro({ keepBackground = false } = {}) {
    this.introStart = performance.now();
    this.introKeepsBackground = keepBackground;
  }

  /* Anything that needs the finished poster — every export — calls this first. */
  skipIntro() {
    this.introStart = 0;
    this.nameAt = 0;
    this.nameFrom = 0;
  }

  /* How much of two strings is identical from the left. Typing a letter moves
     this by one, so only that letter animates; editing in the middle replays
     from the edit onward, which is what it looks like it should do. */
  static sharedPrefix(a = '', b = '') {
    const n = Math.min(a.length, b.length);
    let i = 0;
    while (i < n && a[i] === b[i]) i++;
    return i;
  }

  get introT() {
    if (!this.introStart) return 1;
    const t = (performance.now() - this.introStart) / INTRO_MS;
    if (t >= 1) {
      this.introStart = 0;
      return 1;
    }
    return t;
  }

  /* Video mode loops for exactly as long as the clip; image mode is a still, so
     the number only matters if something asks it for a video anyway. */
  get loopSeconds() {
    const d = this.mode === 'video' ? this.video?.duration : 0;
    return Number.isFinite(d) && d > 0.2 ? d : STILL_LOOP;
  }

  /* Background loading is async, so the poster keeps rendering the old one until
     the new edition's image is in — no flash of empty frame while switching. */
  async setData(data) {
    const bgChanged =
      this.data?.edition?.id !== data.edition?.id || this.data?.bgIndex !== data.bgIndex;
    if (this.data && this.data.photo !== data.photo) this.pan = { x: 0, y: -0.25 };
    if (this.data && this.data.name !== data.name) {
      this.nameFrom = Poster.sharedPrefix(
        (this.data.name || '').toUpperCase(),
        (data.name || '').toUpperCase(),
      );
      this.nameAt = performance.now();
    }
    this.data = data;
    this.mode = data.mode === 'video' ? 'video' : 'image';
    this.loadPartners(data.edition);
    this.loadLogo(data.edition);

    if (bgChanged || !this.bg) {
      const next = await background(data.edition, data.bgIndex || 0);
      /* Hold the outgoing image so the new one can rise through it. Skipped on
         the very first load, where there is nothing to fade from. */
      if (this.bg && this.bg.image !== next.image) {
        this.bgPrev = this.bg;
        this.bgFade = performance.now();
      }
      this.bg = next;
    }
    if (this.mode === 'video') {
      const want = `${data.edition?.id || '-'}|${data.videoIndex || 0}`;
      if (!this.video || this.videoKey !== want) {
        this.video = await backgroundVideo(data.edition, data.videoIndex || 0);
        this.videoKey = want;
      }
    }

    /* The clip only runs while it is on screen. Exports pause it and seek. */
    if (this.video) {
      if (this.mode === 'video') this.video.play().catch(() => {});
      else this.video.pause();
    }
    return this.bg;
  }

  /* Put the background on the exact frame for `seconds`, then renderAt draws it.
     A no-op for a still, so image exports stay synchronous in practice. */
  async prepare(seconds) {
    if (this.mode !== 'video' || !this.video) return;
    this.video.pause();
    await seek(this.video, seconds % this.loopSeconds);
  }

  resume() {
    if (this.mode === 'video') this.video?.play().catch(() => {});
  }

  /* How the photo is laid into the card: cover-fit, then zoom, then pan —
     clamped so a gap can never open at the edges. */
  photoRect() {
    const p = this.data?.photo;
    if (!p) return null;
    const iw = p instanceof HTMLImageElement ? p.naturalWidth : p.width;
    const ih = p instanceof HTMLImageElement ? p.naturalHeight : p.height;
    const scale = Math.max(L.card.w / iw, L.card.h / ih) * (this.data.photoZoom || 1);
    const dw = iw * scale;
    const dh = ih * scale;
    const slackX = (dw - L.card.w) / 2;
    const slackY = (dh - L.card.h) / 2;
    return {
      dw, dh, slackX, slackY,
      x: L.card.x - slackX + clamp(this.pan.x, -1, 1) * slackX,
      y: L.card.y - slackY + clamp(this.pan.y, -1, 1) * slackY,
    };
  }

  /* Drag deltas arrive in poster pixels; slack converts them to the ratio. */
  nudgePhoto(dx, dy) {
    const r = this.photoRect();
    if (!r) return;
    if (r.slackX > 0.5) this.pan.x = clamp(this.pan.x + dx / r.slackX, -1, 1);
    if (r.slackY > 0.5) this.pan.y = clamp(this.pan.y + dy / r.slackY, -1, 1);
  }

  setFraming(y) {
    this.pan.y = clamp(y, -1, 1);
  }

  renderAt() {
    const c = this.ctx;
    const d = this.data;

    c.fillStyle = '#000';
    c.fillRect(0, 0, W, H);
    if (!d) return this.canvas;

    const t = this.introT;
    const bg = this.introKeepsBackground ? 1 : cue('background', t);

    layer(c, bg, 0, () => {
      this.drawBackground(c, 1 + (1 - bg) * 0.06); // settles out of a slow push-in
      if (L.tintScope === 'background') this.drawTint(c, cue('tint', t));
      this.drawScrim(c);
    });

    layer(c, cue('headline', t), 20, () => this.drawHeadline(c));
    this.drawCard(c, cue('card', t));
    this.drawCopy(c, t);
    layer(c, cue('logo', t), 10, () => this.drawLogo(c));
    layer(c, cue('partners', t), 12, () => this.drawPartners(c));
    if (L.tintScope === 'all') this.drawTint(c, cue('tint', t));
    layer(c, cue('footer', t), 14, () => this.drawHostMark(c));
    return this.canvas;
  }

  /* Video mode draws the clip's current frame and adds no motion of its own —
     the footage already moves. A still gets no push-in either: image mode only
     ever exports a PNG, so animating it would just make that PNG's crop a
     lottery. Both are cover-fit and anchored slightly above centre. */
  drawBackground(c, zoom = 1) {
    const useVideo = this.mode === 'video' && this.video && this.video.readyState >= 2;
    if (useVideo) return paintCover(c, this.video, zoom, 1);

    let p = 1;
    if (this.bgFade) {
      p = clamp((performance.now() - this.bgFade) / BG_FADE_MS, 0, 1);
      if (p >= 1) {
        this.bgFade = 0;
        this.bgPrev = null;
      }
    }
    /* The outgoing shot stays put underneath while the new one rises through it
       and settles out of a slight push-in — a swap you can follow rather than a
       cut you only notice afterwards. */
    if (this.bgPrev && p < 1) paintCover(c, this.bgPrev.image, zoom, 1);
    paintCover(c, this.bg?.image, zoom * (1 + (1 - p) * 0.05), this.bgPrev ? easeOut(p) : 1);
  }

  /* Two passes: an even knock-back over the whole photo so white type stays
     legible on any image, then the fall to solid black that the lower half of
     the poster is built on. */
  drawScrim(c) {
    /* Light enough that a bright beach shot still reads as one — the headline's
       contrast comes from the top wash below, not from flattening the photo. */
    c.fillStyle = 'rgba(0,0,0,.12)';
    c.fillRect(0, 0, W, H);

    /* The headline is white and the background is whatever someone uploads —
       this top-down wash is what guarantees it stays readable over a bright sky
       or a pale concrete ceiling. */
    const top = c.createLinearGradient(0, 0, 0, H * 0.30);
    top.addColorStop(0, 'rgba(0,0,0,.50)');
    top.addColorStop(0.5, 'rgba(0,0,0,.16)');
    top.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = top;
    c.fillRect(0, 0, W, H * 0.30);

    const fadeTop = H * 0.28;
    const fadeEnd = H * 0.60;
    const g = c.createLinearGradient(0, fadeTop, 0, fadeEnd);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, 'rgba(0,0,0,.62)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = g;
    c.fillRect(0, fadeTop, W, fadeEnd - fadeTop);
    c.fillStyle = '#000';
    c.fillRect(0, fadeEnd - 1, W, H - fadeEnd + 1);
  }

  /* Sits *behind* the card — the card crops its lower edge, which is what gives
     the layout its depth. Drawn before the card for exactly that reason. */
  drawHeadline(c) {
    /* `??` rather than `||`, because an empty string is a real choice here —
       the "None" option — and must not fall through to the default. */
    const text = this.data?.headline ?? L.headline;
    const eyebrow = variant().eyebrow;
    if (!text && !eyebrow) return;

    let capTop = L.card.y;
    if (text) {
      const size = fitSize(c, text, L.headMaxW, DISPLAY_WEIGHT, L.headTrack, L.headCap, DISPLAY_FONT);
      const cap = capHeight(c, size, DISPLAY_WEIGHT, DISPLAY_FONT);
      const base = L.card.y - L.headGap;
      capTop = base - cap;
      c.fillStyle = WHITE;
      drawTracked(c, text, W / 2, base, size, DISPLAY_WEIGHT, L.headTrack, 'center', DISPLAY_FONT);
    }

    /* Sits above the headline, set small and wide — the same voice as the URL in
       the footer, so it reads as a label rather than a second headline. */
    if (eyebrow) {
      c.fillStyle = mixHex(ACCENT, '#FFFFFF', L.footTone); // the footer's tone
      drawTracked(c, eyebrow, W / 2, capTop - L.eyebrowGap, L.eyebrowSize, 600, L.eyebrowTrack, 'center');
    }
  }

  drawCard(c, progress = 1) {
    if (progress <= 0) return;
    const { x, y, w, h, r } = L.card;
    c.save();
    c.globalAlpha = progress;
    if (progress < 1) {
      const k = 0.94 + 0.06 * progress;
      c.translate(x + w / 2, y + h / 2);
      c.scale(k, k);
      c.translate(-(x + w / 2), -(y + h / 2));
    }
    roundRect(c, x, y, w, h, r);
    c.clip();

    c.fillStyle = '#14161A';
    c.fillRect(x, y, w, h);

    const p = this.photoRect();
    if (p) c.drawImage(this.data.photo, p.x, p.y, p.dw, p.dh);

    /* The drop ring is painted here, inside the card's clip and *before* the
       fade, so the gradient washes over its lower half and the date and city
       print on top of it. Drawn as an HTML overlay it sat above the canvas and
       cut a hard line straight through the type. */
    if (this.dropActive) {
      roundRect(c, x, y, w, h, r);
      c.strokeStyle = ACCENT;
      c.lineWidth = 8; // half is clipped away, so this reads as a 4px inset ring
      c.stroke();
    }

    /* The fade the copy sits on. Ends fully black so the card dissolves into the
       poster instead of stopping at a hard edge. */
    const g = c.createLinearGradient(0, y + h * 0.42, 0, y + h);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.45, 'rgba(0,0,0,.55)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = g;
    c.fillRect(x, y, w, h);
    c.restore();
  }

  drawCopy(c, t = 1) {
    const d = this.data;

    /* With no edition chosen the poster still has to read as a poster, so both
       slots hold their shape: the date line announces the tour, and the name
       line shows where a name will go. */
    const date = d.edition?.date || 'COMING SOON';
    const dateSize = fitSize(c, date, L.dateMaxW, L.dateWeight, L.dateTrack, L.dateCap, MONO_FONT);
    const dateBase = L.card.bottom - L.dateGap;
    layer(c, cue('date', t), 12, () => {
      c.fillStyle = ACCENT;
      drawTracked(c, date, W / 2, dateBase, dateSize, L.dateWeight, L.dateTrack, 'center', MONO_FONT);
    });

    /* Before an event is picked the poster still has to say what it is for. The
       wordmark already carries the brand, so this slot describes the occasion
       instead of repeating the name below it. */
    /* The MAKE.EXE lockup stands where the title text used to. It is the
       evening's name set better than type could set it here — outlined letters
       with the pink full stop — and the date line above already carries the
       year and the city, so nothing is lost by not spelling it out again. */
    const tm = this.wordmark;
    const titleTop = dateBase + L.dateToTitle;
    let cityBottom = titleTop;
    if (tm.naturalWidth) {
      const mw = L.titleMarkW;
      const mh = (mw * tm.naturalHeight) / tm.naturalWidth;
      layer(c, cue('city', t), 18, () => {
        c.drawImage(tm, (W - mw) / 2, titleTop, mw, mh);
      });
      cityBottom = titleTop + mh;
    }

    /* The show is a given here, so an empty name is the only thing that can
       still be missing — and the slot should say so rather than sit blank. */
    const placeholder = !d.name;
    const name = (d.name || (placeholder ? 'Your name' : '')).toUpperCase();
    if (name) {
      const nameSize = fitSize(c, name, L.nameMaxW, L.nameWeight, L.nameTrack, L.nameCap);
      const y = cityBottom + L.markToName;
      let reveal = 1;
      if (this.nameAt) {
        reveal = (performance.now() - this.nameAt) / NAME_REVEAL_MS;
        if (reveal >= 1) {
          this.nameAt = 0;
    this.nameFrom = 0;
          reveal = 1;
        }
      }
      layer(c, cue('name', t), 14, () => {
        /* Dimmed when it is standing in for a name, so it reads as an invitation
           rather than as somebody called Your Name. */
        c.fillStyle = placeholder ? mixHex(WHITE, '#000000', 0.52) : WHITE;
        if (reveal < 1) {
          drawTrackedReveal(c, name, W / 2, y, nameSize, L.nameWeight, L.nameTrack, 'center', reveal, this.nameFrom);
        } else {
          drawTracked(c, name, W / 2, y, nameSize, L.nameWeight, L.nameTrack, 'center');
        }
      });
    }

    /* Optional, and genuinely optional: nothing stands in for it when empty,
       because a poster with no role reads as finished, while a greyed-out
       "Your role" would read as a form someone abandoned. */
    const role = (d.role || '').toUpperCase();
    if (role) {
      const roleSize = fitSize(c, role, L.roleMaxW, 500, L.roleTrack, L.roleCap);
      const roleY = cityBottom + L.markToName + L.roleGap;
      layer(c, cue('role', t), 12, () => {
        c.fillStyle = mixHex(WHITE, '#000000', L.roleTone);
        drawTracked(c, role, W / 2, roleY, roleSize, 500, L.roleTrack, 'center');
      });
    }
  }

  /* Drawn after the brand wash rather than under it: a multiply ramp over a
     partner's logo tints it, and a logo that is not the partner's colour is
     worse than one drawn a layer too high. */
  drawHostMark(c) {
    const fm = this.footMark;
    if (!fm.naturalWidth) return;
    const h = L.hostMarkH;
    const w = (h * fm.naturalWidth) / fm.naturalHeight;
    const right = W - L.side;
    const top = L.footBase + L.hostDrop - h;

    /* The label is read from the layout rather than hardcoded, and an empty
       string turns it off — which is what a co-branded lockup would want, since
       one caption cannot describe two marks. */
    if (L.hostLabel) {
      /* Fitted to the mark's own width rather than set at a fixed size, so the
         label and the logo under it read as one block instead of two things
         that happen to be near each other. */
      const labelSize = fitSize(c, L.hostLabel, w, 600, L.hostLabelTrack, L.hostLabelCap);
      c.fillStyle = mixHex(WHITE, '#000000', 0.42);
      drawTracked(c, L.hostLabel, right, top - L.hostLabelGap,
                  labelSize, 600, L.hostLabelTrack, 'right');
    }
    c.drawImage(fm, right - w, top, w, h);
  }

  drawTint(c, progress = 1) {
    if (!L.tintStrength || progress <= 0) return;
    const neutral = NEUTRAL[L.tintMode] || '#FFFFFF';
    const end = mixHex(neutral, ACCENT, L.tintStrength * progress);
    const g = c.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, neutral);
    g.addColorStop(0.32, mixHex(neutral, end, 0.22));
    g.addColorStop(1, end);
    c.save();
    c.globalCompositeOperation = L.tintMode;
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    c.restore();
  }

  /* An edition can carry a partner strip; most don't. Loaded once per edition
     and cached as null when absent, so a missing file is never re-requested. */
  loadPartners(edition) {
    if (!edition?.partners) return;
    if (this.partners.has(edition.id)) return;
    this.partners.set(edition.id, null);
    const img = new Image();
    img.onload = () => this.partners.set(edition.id, img);
    img.src = `assets/img/${edition.partners}`;
  }

  /* Loaded once per edition and cached as null when absent, so an edition with
     no mark never re-requests one. */
  loadLogo(edition) {
    if (!edition?.logo) return;
    if (this.logos.has(edition.id)) return;
    this.logos.set(edition.id, null);
    const img = new Image();
    img.onload = () => this.logos.set(edition.id, img);
    img.src = `assets/img/${edition.logo}`;
  }

  drawLogo(c) {
    const img = this.logos.get(this.data?.edition?.id);
    if (!img) return;
    const h = L.logoH;
    const w = (h * img.naturalWidth) / img.naturalHeight;
    c.drawImage(img, (W - w) / 2, L.logoTop, w, h);
  }

  drawPartners(c) {
    const img = this.partners.get(this.data?.edition?.id);
    if (!img) return;
    const w = L.partnersMaxW;
    const h = (w * img.naturalHeight) / img.naturalWidth;
    c.drawImage(img, (W - w) / 2, L.partnersTop, w, h);
  }

}

export { FONT };
