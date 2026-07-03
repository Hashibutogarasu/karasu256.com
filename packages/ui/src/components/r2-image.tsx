import type { ImgHTMLAttributes } from 'react';

export interface R2ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

/**
 * Renders an image hosted on an R2-backed CDN (e.g. uploaded OAuth client
 * icons) as a plain `<img>`, so callers never need to route these origins
 * through a framework image-optimization pipeline that can reject them.
 */
export function R2Image({ src, alt, ...props }: R2ImageProps) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} {...props} />;
}
