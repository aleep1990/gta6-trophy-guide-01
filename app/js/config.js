// Leonida Ledger — shared constants: storage keys, kinds, grades and the platinum roadmap.
// The roadmap stages are built from the official descriptions: story first, then side
// characters, activities, collectibles, heists and chaos, and the long grinds last.

export const STORAGE_KEY = 'leonida-ledger-v1';
export const TOTAL_TROPHIES = 55;

export const GRADES = ['platinum', 'gold', 'silver', 'bronze'];
export const GRADE_LABELS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

export const KINDS = ['story', 'activity', 'collectible', 'grind', 'misc'];
export const KIND_LABELS = {
  story: 'Story',
  activity: 'Activity',
  collectible: 'Collectible',
  grind: 'Grind',
  misc: 'Misc',
};

export const ROADMAP_STAGES = [
  {
    id: 'story',
    title: '1 · Play the story',
    why: 'Chapters and story missions first. They unlock everything else, and several one-time moments live here — keep a manual save at the start of every chapter.',
    trophyIds: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  },
  {
    id: 'side',
    title: '2 · Side characters',
    why: 'The named side characters each have a mission strand ending in a final mission. Stranger strands count toward the silver too — do them while the story is still fresh.',
    trophyIds: [22, 23, 24, 26, 27, 29, 25],
  },
  {
    id: 'activities',
    title: '3 · Learn Leonida',
    why: 'Sample every activity type once, then work the skill ones: 42 Shooting Range challenges, 14 drone-race locations, 20 different races, fishing, the arcade and bowling.',
    trophyIds: [16, 17, 18, 19, 20, 21, 46, 51],
  },
  {
    id: 'collect',
    title: '4 · Collect & explore',
    why: 'The slow explore-as-you-go stage: meditation spots (do the Chapter 1 spot early — it is the one flagged missable), card sets, WAiNK It locations, vehicles, all 52 areas, garages and the Scooter Bros app.',
    trophyIds: [28, 30, 31, 35, 42, 54, 55, 44],
  },
  {
    id: 'chaos',
    title: '5 · Heists, heat & chaos',
    why: 'Robberies and wanted-level play: bank vaults, armored trucks, jewelry stores, gang operations, the airport, the showroom, and the partner robberies. Most are retryable — plan the escape before the robbery.',
    trophyIds: [33, 34, 36, 37, 38, 39, 40, 41, 43, 45, 47, 48, 49, 50],
  },
  {
    id: 'grind',
    title: '6 · Grind & platinum',
    why: 'The long counts last: 250 stunts, 50 challenges, $250,000 of laundered Marked Bills and $100,000 spent. When they are done, 100% completion and the platinum pop together.',
    trophyIds: [15, 32, 52, 53, 14, 1],
  },
];

// Trophies tied to a one-time story moment. They are not confirmed missable — the
// community discussion suggests nothing in the game is missable — but there is no
// confirmed mission replay, so the guide tells players to keep a manual save.
export const WATCH_LIST_IDS = [2, 7, 8, 9, 10, 11, 12, 13, 22, 23, 24, 26, 27];
