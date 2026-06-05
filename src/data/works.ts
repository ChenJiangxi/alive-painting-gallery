/**
 * Painting metadata for the "Picasso in Motion" exhibit.
 *
 * Each entry has the original-painting file (static) and optional motion file(s).
 * Year and English title are filled where the work is unambiguous; others left
 * as null for Jessy to fill in. The display layer falls back gracefully.
 *
 * Files live in /public/works/picasso-in-motion/ and are referenced by
 * encoded URL because the names are Chinese.
 */

export type Work = {
  id: string;
  /** Chinese painting name (also the filename root) */
  title: string;
  /** Best-effort English title; null = not provided */
  titleEn: string | null;
  /** Year if confidently known; null = not provided */
  year: number | null;
  /** Static image filename inside /works/picasso-in-motion/ */
  staticSrc: string;
  /** Motion video filename(s) inside /works/picasso-in-motion/, in display order */
  motionSrcs: string[];
  /** Optional curator note about the motion intervention (placeholder if empty) */
  note?: string;
};

const ROOT = '/works/picasso-in-motion';

export const works: Work[] = [
  {
    id: 'weeping-woman',
    title: '哭泣的女人',
    titleEn: 'Weeping Woman',
    year: 1937,
    staticSrc: `${ROOT}/哭泣的女子.webp`,
    motionSrcs: [`${ROOT}/哭泣的女人.mp4`],
  },
  {
    id: 'woman-with-hat-gaze',
    title: '戴帽女人的凝视',
    titleEn: 'Woman with a Hat',
    year: null,
    staticSrc: `${ROOT}/戴帽子的女子.webp`,
    motionSrcs: [`${ROOT}/戴帽女人的凝视.mp4`],
  },
  {
    id: 'cubist-pierrot-moving',
    title: '立体派小丑（运动镜头）',
    titleEn: 'Cubist Pierrot — Moving Camera',
    year: null,
    staticSrc: `${ROOT}/小丑.webp`,
    motionSrcs: [`${ROOT}/立体派小丑演奏.mp4`],
  },
  {
    id: 'cubist-pierrot-fixed',
    title: '立体派小丑（固定镜头）',
    titleEn: 'Cubist Pierrot — Fixed Camera',
    year: null,
    staticSrc: `${ROOT}/小丑.webp`,
    motionSrcs: [`${ROOT}/立体派小丑演奏_固定镜头.mp4`],
    note: '同一幅画的两次镜头练习。',
  },

  // -------- statics, no motion yet --------
  {
    id: 'guernica',
    title: '格尔尼卡',
    titleEn: 'Guernica',
    year: 1937,
    staticSrc: `${ROOT}/格尔尼卡.webp`,
    motionSrcs: [],
  },
  {
    id: 'the-dream',
    title: '梦',
    titleEn: 'Le Rêve',
    year: 1932,
    staticSrc: `${ROOT}/梦.webp`,
    motionSrcs: [],
  },
  {
    id: 'first-steps',
    title: '蹒跚学步',
    titleEn: 'First Steps',
    year: 1943,
    staticSrc: `${ROOT}/蹒跚学步.webp`,
    motionSrcs: [],
  },
  {
    id: 'violin',
    title: '小提琴',
    titleEn: 'Violin',
    year: null,
    staticSrc: `${ROOT}/小提琴.webp`,
    motionSrcs: [],
  },
  {
    id: 'matador',
    title: '斗牛士',
    titleEn: 'Matador',
    year: null,
    staticSrc: `${ROOT}/斗牛士.webp`,
    motionSrcs: [],
  },
  {
    id: 'bullfighter-on-horseback',
    title: '骑马斗牛士',
    titleEn: 'Bullfighter on Horseback',
    year: null,
    staticSrc: `${ROOT}/骑马斗牛士.webp`,
    motionSrcs: [],
  },
  {
    id: 'man-with-straw-hat-icecream',
    title: '戴着草帽吃冰淇淋的男子',
    titleEn: 'Man with Straw Hat and Ice Cream',
    year: null,
    staticSrc: `${ROOT}/戴着草帽吃冰淇淋的男子.webp`,
    motionSrcs: [],
  },
  {
    id: 'woman-with-hat-alt',
    title: '戴帽的女人',
    titleEn: 'Woman in a Hat',
    year: null,
    staticSrc: `${ROOT}/戴帽的女人.jpeg`,
    motionSrcs: [],
  },
  {
    id: 'table-by-window',
    title: '窗前的桌子',
    titleEn: 'Table by the Window',
    year: null,
    staticSrc: `${ROOT}/窗前的桌子.webp`,
    motionSrcs: [],
  },
  {
    id: 'couple-on-street',
    title: '街上的情侣',
    titleEn: 'Couple in the Street',
    year: null,
    staticSrc: `${ROOT}/街上的情侣.webp`,
    motionSrcs: [],
  },
  {
    id: 'sewing-woman-with-children',
    title: '缝纫的女人，孩子环绕在身旁',
    titleEn: 'Sewing Woman Surrounded by Her Children',
    year: null,
    staticSrc: `${ROOT}/缝纫的女人周围环绕着她的孩子们  .webp`,
    motionSrcs: [],
  },
];

/** Encode the path segment so spaces / Chinese names survive the browser URL bar. */
export function safeSrc(src: string): string {
  // /works/picasso-in-motion/X — only encode the final segment
  const slash = src.lastIndexOf('/');
  return src.slice(0, slash + 1) + encodeURIComponent(src.slice(slash + 1));
}
