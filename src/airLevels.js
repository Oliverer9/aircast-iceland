// Colours for the six European Air Quality Index levels (index 0–5), from green-blue to purple.
// The level name is always shown as text too, so colour is never the only clue.
// The names themselves are in i18n.jsx, in English and Icelandic.
export const LEVEL_COLORS = ['#50f0e6', '#50ccaa', '#f0e641', '#ff5050', '#960032', '#7d2181'];
export const NO_INDEX_COLOR = '#9e9e9e';

export const levelColor = (level) => (level ? LEVEL_COLORS[level.index] : NO_INDEX_COLOR);

// Text on a level colour: dark on the light ones (5.1:1 or more), white on the two
// darkest, Very poor and Extremely poor (8.7:1 or more).
export const levelTextColor = (level) => (level && level.index >= 4 ? '#fff' : '#10202f');
