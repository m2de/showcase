// The M² mark lives here as a grid so every rendition (vector, mosaic,
// animation, material renders) is drawn from the same cells.
// 1 = M, 2 = the square. 14 columns x 7 rows.
export const MARK = [
  '11000000011022',
  '11100000111022',
  '11110001111000',
  '11011011011000',
  '11001110011000',
  '11000100011000',
  '11000000011000',
];

// The paddock: two grounds, and five colours the square can wear.
// The M never changes; each piece picks one square colour, like a livery.
// Yellow and gulf disappear on chalk, so they go on dark grounds or a white plate.
// With no other reason to choose: red on light grounds, Gulf blue on dark ones.
export const INK = '#111110', CHALK = '#EFEEE8';
export const PADDOCK = { red: '#E10A23', yellow: '#FFC72C', green: '#2A8456', gulf: '#8FC6E8', violet: '#7B6CD9' };
export const LIGHT_ONLY_ON_DARK = ['yellow', 'gulf'];

export const COLS = MARK[0].length;
export const ROWS = MARK.length;

export function cells(kind) {
  const out = [];
  MARK.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c !== '0' && (kind === undefined || c === kind)) out.push({ x, y, kind: c });
    })
  );
  return out;
}

// Merge each row's runs into rectangles so the SVG has no hairline seams.
function runs(kind) {
  const rects = [];
  MARK.forEach((row, y) => {
    let start = -1;
    for (let x = 0; x <= row.length; x++) {
      const on = x < row.length && row[x] === kind;
      if (on && start < 0) start = x;
      if (!on && start >= 0) { rects.push({ x: start, y, w: x - start }); start = -1; }
    }
  });
  return rects;
}

function path(kind) {
  return runs(kind).map(r => `M${r.x} ${r.y}h${r.w}v1h-${r.w}z`).join('');
}

// fit: 'square' centres the mark on a square canvas (favicons, avatars).
export function svg({ m = '#111110', square = PADDOCK.red, bg = null, pad = 0, fit = null, title = 'Marco Mark' } = {}) {
  let x = -pad, y = -pad, w = COLS + pad * 2, h = ROWS + pad * 2;
  if (fit === 'square') { y -= (w - h) / 2; h = w; }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" shape-rendering="crispEdges" role="img" aria-label="${title}">` +
    (bg ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${bg}"/>` : '') +
    `<path fill="${m}" d="${path('1')}"/><path fill="${square}" d="${path('2')}"/></svg>`;
}

// The square's bounding box in cells, for materials that draw it as one piece.
export function squareBox() {
  const c = cells('2');
  const xs = c.map(p => p.x), ys = c.map(p => p.y);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs) + 1, h: Math.max(...ys) - Math.min(...ys) + 1 };
}
