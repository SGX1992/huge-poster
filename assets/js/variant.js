/* There is one audience for this poster: the people Huge and DDX invited to
   MAKE.EXE in New York. The tour tools this was adapted from carry a picker
   here — attendee, speaker, exhibitor — because their shows have several kinds
   of visitor to tell apart. One guest list does not, so the picker is gone and
   this file is a single constant.

   It stays a module rather than being folded into the poster because poster.js
   asks it for an eyebrow at render time, and keeping the shape means a label
   above the headline is one line away if the night ever needs one. */

const HEADLINES = ['I AM INVITED', 'I AM GOING', 'SEE YOU AT'];
const CHIPS = ['I am invited', 'I am going', 'See you at'];

/* No label above the headline. Everyone holding this poster is a guest, and
   printing "GUEST" on all of them would say nothing the invitation doesn't. */
export const variant = () => ({
  eyebrow: null,
  headlines: HEADLINES,
  chips: CHIPS,
  title: 'I am invited | MAKE.EXE New York',
  slug: 'makeexe',
});
