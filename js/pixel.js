// Pixel Art วาดด้วยโค้ด: แต่ละตัวอักษรในตาราง = 1 พิกเซล ('.' = โปร่งใส)
import { RARITY } from './items.js';

const HEADS = {
  balanced: [
    '................',
    '.....kkkkkk.....',
    '....kHHHHHHk....',
    '..kkHHHHHHHHkk..',
    '..kHHHHHHHHHHk..',
    '...kkkkkkkkkk...',
    '....khsssshk....',
    '....kseksesk....',
    '....kssssssk....',
  ],
  warrior: [
    '...k..k..k..k...',
    '...khkhkkhkhk...',
    '...khhhhhhhhk...',
    '...kaaaaaaaak...',
    '...khhhhhhhhk...',
    '....khsssshk....',
    '....ksekseek....',
    '....ksssmssk....',
    '.....kssssk.....',
  ],
  mage: [
    '.......kk.......',
    '......kaak......',
    '.....kaaaak.....',
    '....kaayaaak....',
    '...kaaaaaaaak...',
    '..kkkkkkkkkkkk..',
    '....khsssshk....',
    '....kseksesk....',
    '....kssssssk....',
  ],
  guardian: [
    '.....kkkkkk.....',
    '....kaaaaaak....',
    '...kaaaaaaaak...',
    '...kaakkkkaak...',
    '...kakhhhhkak...',
    '...kakssssksk...',
    '...kakeksekak...',
    '....kssssssk....',
    '.....kssssk.....',
  ],
};
const BODY = [
  '.....kssssk.....',
  '...kkbbbbbbkk...',
  '..kbbbbabbbbbk..',
  '.kbbbbbabbbbbbk.',
  '.ksbbbbabbbbbsk.',
  '.ksbbbbbbbbbbsk.',
  '.kskbbbbbbbbksk.',
  '..k.kccccccck...',
  '....kppppppk....',
  '....kpppkpppk...',
  '....kppk.kppk...',
  '...kffk...kffk..',
  '...kkkk...kkkk..',
];

const CLASS_PAL = {
  balanced: { H: '#c8a165', a: '#7b5a2e', b: '#6f8f4e', h: '#3b2a1a' },
  warrior:  { H: '#000', a: '#d64541', b: '#8a5a3c', h: '#2b1a10' },
  mage:     { H: '#000', a: '#5b4bd1', b: '#4a3d9a', h: '#2a2140', y: '#ffd84d' },
  guardian: { H: '#000', a: '#7f8c99', b: '#5b6b7a', h: '#2b2b2b' },
};
const BASE_PAL = { k: '#1b1420', s: '#f1c49b', e: '#1b1420', w: '#ffffff', m: '#b5523b', p: '#3d4a6b', c: '#3a2a1a', f: '#5a3b22', y: '#ffd84d' };

const WEAPONS = {
  weapon: ['..k...', '.kxk..', 'kxxxk.', 'kxxxk.', '.kxk..', '..kw..', '..kw..', '..kw..', '..kw..', '..kk..'],
};

export function heroGrid(cls) { return [...HEADS[cls], ...BODY]; }

export function heroPalette(cls, gear = {}) {
  const pal = { ...BASE_PAL, ...CLASS_PAL[cls] };
  if (gear.armor != null) pal.b = mix(pal.b, RARITY[gear.armor].color, 0.55);
  if (gear.boots != null) pal.f = RARITY[gear.boots].color;
  if (gear.acc != null) pal.c = RARITY[gear.acc].color;
  return pal;
}
function mix(a, b, t) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

const BOSS = {
  stoneGuardian: {
    pal: { k: '#1b1420', g: '#8d8f96', d: '#5f6168', l: '#b9bcc4', r: '#5ef0ff', m: '#6b4a2b' },
    grid: [
      '........kkkkkkkk........',
      '......kkllllllllkk......',
      '.....kllggggggggllk.....',
      '....klggggggggggggk.....',
      '....kgggrrggggrrgggk....',
      '....kggrrrrggrrrrggk....',
      '....kgggrrggggrrgggk....',
      '....kgggggggggggggdk....',
      '....kgdddggggggdddgk....',
      '..kkkgggdrdrdrdggggkkk..',
      '.kllkggggggggggggggkllk.',
      'kllgkgdrrdgdrrdgdrgkgllk',
      'klggkggggggggggggggkggdk',
      'kggdkgdrdrggdrdrgggkgddk',
      'kgddkggggggggggggggkdddk',
      '.kkkkgdrrdgrrrdgdrgkkkk.',
      '....kggggggggggggggk....',
      '....kgddgggggggddggk....',
      '....kgggggggggggggdk....',
      '....kkgggdkkkkgggdkk....',
      '.....kgggdk..kgggdk.....',
      '.....kggddk..kggddk.....',
      '....kkkkkkk..kkkkkkk....',
      '........................',
    ],
  },
  potGiant: {
    pal: { k: '#1b1420', o: '#c0703a', d: '#8a4a24', l: '#e3a067', e: '#ffe066', r: '#5a2a14' },
    grid: [
      '........................',
      '.......kkkkkkkkkk.......',
      '......kddddddddddk......',
      '.......kkkkkkkkkk.......',
      '........kooooook........',
      '.......koooooooook......',
      '.....kkooolllloooookk...',
      '....kooolllllllllooook..',
      '...kooeekoolllooeekooook',
      '...kooeekoolllooeekoooko',
      '..kooooooooooooooooooook',
      'kkooordrdrdrdrdrdrdroook',
      'kookooooooooooooooooooko',
      'kok.kooorrrrrrrrroooook.',
      '.k..kooooooooooooooook..',
      '....kdoooooooooooooodk..',
      '.....kddoooooooooooddk..',
      '......kkddddddddddkk....',
      '.......kdk..kdk..kdk....',
      '.......kdk..kdk..kdk....',
      '.......kdk..kdk..kdk....',
      '......kddk.kddk.kddk....',
      '......kkkk.kkkk.kkkk....',
      '........................',
    ],
  },
};

const CHEST = [
  '..kkkkkkkkkk..',
  '.kccccccccccck',
  'kcllllllllllck',
  'kccccccccccccck',
  'kkkkkkyykkkkkk',
  'kcccccykycccck',
  'kccccccyccccck',
  'kccccccccccck.',
  'kkkkkkkkkkkkk.',
];

export function draw(grid, pal, scale = 6) {
  const w = Math.max(...grid.map(r => r.length)), h = grid.length;
  const c = document.createElement('canvas');
  c.width = w * scale; c.height = h * scale;
  c.className = 'px';
  const g = c.getContext('2d');
  grid.forEach((row, y) => [...row].forEach((ch, x) => {
    const col = pal[ch]; if (!col || ch === '.') return;
    g.fillStyle = col; g.fillRect(x * scale, y * scale, scale, scale);
  }));
  return c;
}

// ตัวละคร + อาวุธที่ถือ (สีตามความหายาก)
export function hero(cls, gear = {}, scale = 6) {
  const grid = heroGrid(cls).map(r => r.padEnd(16, '.'));
  const pal = heroPalette(cls, gear);
  const wide = grid.map(r => r + '......');
  if (gear.weapon != null) {
    pal.x = RARITY[gear.weapon].color; pal.w = '#7a5230';
    WEAPONS.weapon.forEach((row, i) => {
      const y = 7 + i; if (!wide[y]) return;
      wide[y] = wide[y].slice(0, 15) + row + wide[y].slice(15 + row.length);
    });
  }
  return draw(wide, pal, scale);
}
export function boss(name, scale = 7) { const b = BOSS[name]; return draw(b.grid, b.pal, scale); }
export function chest(color, scale = 5) {
  return draw(CHEST, { k: '#1b1420', c: color, l: '#ffffff55', y: '#ffd84d' }, scale);
}
