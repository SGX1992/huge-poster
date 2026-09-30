/* One night, one room — so there is nothing to pick and no picker to pick it
   with. The event is a constant that the poster, the date line, the background
   manifest and the export filename all read from.

   `id` has to match the key in assets/img/bg/manifest.json; that is the only
   place the two files meet.

   `date` is what the poster prints under the card. It carries the city as well
   as the day: the MAKE.EXE lockup on the title line says what the evening is
   but not where it is, and on a poster that will be posted by people who are
   flying in, where matters as much as when. */
export const THE_EVENT = {
  id: 'makeexe-nyc',
  city: 'New York',
  poster: 'MAKE.EXE',
  date: '6 OCTOBER 2026 · NEW YORK',
  dated: true,
  tint: '#3A0F2A',
  venue: 'SHiFT Midtown, 330 W 38th St',
};

/* Kept for the modules that were written against a tour of several events —
   they ask an event what it prints, and here the answer never changes. */
export const posterName = (e) => e?.poster || e?.city || '';
