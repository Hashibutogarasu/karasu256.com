import { Geist, Geist_Mono, Noto_Sans_JP } from 'next/font/google';

/** Latin body/UI font, shared across every app so `--font-sans` resolves identically everywhere. */
export const geistSans = Geist({ variable: '--font-sans', subsets: ['latin'] });

/** Monospace font for code/IDs. */
export const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

/** CJK fallback so ja/cn glyphs render consistently with the Geist Latin text instead of the OS default font. */
export const notoSansJP = Noto_Sans_JP({ variable: '--font-noto-jp', subsets: ['latin'] });
