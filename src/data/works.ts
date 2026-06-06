/**
 * Painting metadata for the "Picasso in Motion" exhibit.
 *
 * Source of truth is the per-work folder on the Desktop. Each entry below
 * matches one such folder. Statics that don't yet have a motion counterpart
 * leave motionSrcs empty; the layout falls back gracefully and the work
 * shows as a still on the rotunda wall.
 *
 * File names are Chinese; they're served from /works/picasso-in-motion/
 * and URL-encoded at render time by safeSrc().
 */

export type Work = {
  id: string;
  /** Chinese painting name (also the folder root) */
  title: string;
  /** Best-effort English title; null = not provided */
  titleEn: string | null;
  /** Year if confidently known; null = not provided */
  year: number | null;
  /** Static image filename inside /works/picasso-in-motion/ */
  staticSrc: string;
  /** Motion video filename inside /works/picasso-in-motion/; null = static only */
  motionSrc: string | null;
  /** Optional curator note */
  note?: string;
};

const ROOT = '/works/picasso-in-motion';

export const works: Work[] = [
  {
    id: 'weeping-woman',
    title: '哭泣的女子',
    titleEn: 'Weeping Woman',
    year: 1937,
    staticSrc: `${ROOT}/哭泣的女子.webp`,
    motionSrc: `${ROOT}/哭泣的女人_一致性优化.mp4`,
  },
  {
    id: 'woman-with-hat-gaze',
    title: '戴帽子的女人',
    titleEn: 'Woman with a Hat',
    year: null,
    staticSrc: `${ROOT}/戴帽的女人.jpeg`,
    motionSrc: `${ROOT}/戴帽女人的凝视.mp4`,
  },
  {
    id: 'woman-with-hat-2',
    title: '戴帽子的女子',
    titleEn: 'Woman in a Hat',
    year: null,
    staticSrc: `${ROOT}/戴帽子的女子.webp`,
    motionSrc: `${ROOT}/戴帽子女子的凝视.mp4`,
  },
  {
    id: 'cubist-pierrot',
    title: '小丑',
    titleEn: 'Cubist Pierrot',
    year: null,
    staticSrc: `${ROOT}/小丑.webp`,
    motionSrc: `${ROOT}/立体派小丑演奏_固定镜头.mp4`,
  },
  {
    id: 'violin',
    title: '小提琴',
    titleEn: 'Violin',
    year: null,
    staticSrc: `${ROOT}/小提琴.webp`,
    motionSrc: `${ROOT}/分析立体派小提琴演奏.mp4`,
  },
  {
    id: 'man-with-straw-hat-icecream',
    title: '戴着草帽吃冰淇淋的男子',
    titleEn: 'Man with Straw Hat Eating Ice Cream',
    year: null,
    staticSrc: `${ROOT}/戴着草帽吃冰淇淋的男子.webp`,
    motionSrc: `${ROOT}/吃冰淇淋的男子_完整故事版.mp4`,
  },
  {
    id: 'table-by-window',
    title: '窗前的桌子',
    titleEn: 'Table by the Window',
    year: null,
    staticSrc: `${ROOT}/窗前的桌子.webp`,
    motionSrc: `${ROOT}/窗前桌子的静物.mp4`,
  },
  {
    id: 'sewing-woman-with-children',
    title: '缝纫的女人，孩子环绕在身旁',
    titleEn: 'Sewing Woman Surrounded by Her Children',
    year: null,
    staticSrc: `${ROOT}/缝纫的女人周围环绕着她的孩子们  .webp`,
    motionSrc: `${ROOT}/缝纫的女人与孩子们.mp4`,
  },
  {
    id: 'first-steps',
    title: '蹒跚学步',
    titleEn: 'First Steps',
    year: 1943,
    staticSrc: `${ROOT}/蹒跚学步.webp`,
    motionSrc: `${ROOT}/蹒跚学步_完整故事.mp4`,
  },
  {
    id: 'bullfighter-on-horseback',
    title: '骑马斗牛士',
    titleEn: 'Bullfighter on Horseback',
    year: null,
    staticSrc: `${ROOT}/骑马斗牛士.webp`,
    motionSrc: `${ROOT}/骑马斗牛士_完整搏斗.mp4`,
  },
  {
    id: 'cat-eating-bird',
    title: '吃鸟的猫',
    titleEn: 'Cat Eating a Bird',
    year: null,
    staticSrc: `${ROOT}/吃鸟的猫.webp`,
    motionSrc: `${ROOT}/吃鸟的猫_完整捕食.mp4`,
  },
  // Pending motion (Jessy生成中，到位后加 motionSrc 即可):
  //   - 女子和公鸡 (Desktop/毕加索画作-动起来/女子和公鸡/)
  //   - 画室里的鸽子（委拉斯开兹）
];

/** URL-encode the trailing filename so Chinese names survive the browser. */
export function safeSrc(src: string): string {
  const slash = src.lastIndexOf('/');
  return src.slice(0, slash + 1) + encodeURIComponent(src.slice(slash + 1));
}
