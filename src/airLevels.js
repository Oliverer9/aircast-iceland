// Colours for the six European Air Quality Index levels (index 0–5), from green-blue to purple.
// The level name is always shown as text too, so colour is never the only clue.
export const LEVEL_COLORS = ['#50f0e6', '#50ccaa', '#f0e641', '#ff5050', '#960032', '#7d2181'];
export const LEVEL_NAMES = ['Good', 'Fair', 'Moderate', 'Poor', 'Very poor', 'Extremely poor'];
export const NO_INDEX_COLOR = '#9e9e9e';

export const levelColor = (level) => (level ? LEVEL_COLORS[level.index] : NO_INDEX_COLOR);
export const levelName = (level) => (level ? level.label : 'No index');
