// nodeTheme.js
// --------------------------------------------------
// "AI Pipeline Builder" design system: a node's *category* is its identity.
// Each category carries an accent (used for the icon, the catalog dot, and the
// trace leaving the node) plus a soft tint for the node's icon tile and the
// palette chips. Icons are line glyphs drawn as SVG, one per category.

import { createElement as e } from 'react';

export const CATEGORIES = {
  source:  { accent: '#1F9E6F', tint: '#E7F5EF', label: 'source'  },
  compute: { accent: '#5B45E0', tint: '#ECE8FB', label: 'compute' },
  data:    { accent: '#C58A1B', tint: '#F7EEDD', label: 'data'    },
  logic:   { accent: '#D24F6C', tint: '#F9E7EC', label: 'logic'   },
  sink:    { accent: '#4F6B9E', tint: '#E8EDF6', label: 'sink'    },
};

// The brand accent (indigo), used for the primary action + selection.
export const MARKUP = '#5B45E0';

export const categoryAccent = (category) =>
  (CATEGORIES[category] || CATEGORIES.data).accent;

export const categoryTint = (category) =>
  (CATEGORIES[category] || CATEGORIES.data).tint;

// Per-category line-icon paths (16x16 viewbox), ported from the design.
const ICON_PATHS = {
  source:  [e('path', { key: 1, d: 'M4 3.5v9' }), e('path', { key: 2, d: 'M6.5 8h6' }), e('path', { key: 3, d: 'M10 5l3 3-3 3' })],
  compute: [e('circle', { key: 1, cx: 8, cy: 8, r: 2.4 }), e('path', { key: 2, d: 'M8 1.6v2.1M8 12.3v2.1M1.6 8h2.1M12.3 8h2.1' })],
  data:    [e('rect', { key: 1, x: 3, y: 3.5, width: 10, height: 9, rx: 1.8 }), e('path', { key: 2, d: 'M3 7h10' })],
  logic:   [e('path', { key: 1, d: 'M4 5.2l4 4 4-4' }), e('path', { key: 2, d: 'M4 9.4l4 4 4-4' })],
  sink:    [e('path', { key: 1, d: 'M12 3.5v9' }), e('path', { key: 2, d: 'M3 8h6' }), e('path', { key: 3, d: 'M6.5 5l3 3-3 3' })],
};

// Returns a React <svg> for a category, inked in `color` (defaults to accent).
export const categoryIcon = (category, { size = 14, color } = {}) => {
  const cat = CATEGORIES[category] ? category : 'data';
  return e(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 16 16',
      fill: 'none',
      stroke: color || CATEGORIES[cat].accent,
      strokeWidth: 1.7,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    ICON_PATHS[cat]
  );
};
