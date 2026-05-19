'use client';

import { useState, useEffect, useRef } from 'react';
import Image, { type ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

// ── Client-side image cache using Cache API ─────────────────────────────────
const CACHE_NAME = 'ntd-img-v1';

async function cacheImage(src: string): Promise<void> {
  if (!('caches' in window)) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(src);
    if (!cached) {
      await cache.add(src);
    }
  } catch {
    // Cache API might be restricted in some contexts — fail silently
  }
}

async function isImageCached(src: string): Promise<boolean> {
  if (!('caches' in window)) return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const match = await cache.match(src);
    return !!match;
  } catch {
    return false;
  }
}

// ── Shimmer keyframe as inline CSS ──────────────────────────────────────────
const shimmerStyle = `
  @keyframes ntd-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .ntd-shimmer {
    background: linear-gradient(90deg, #fef9c3 0%, #fef08a 40%, #fde047 50%, #fef08a 60%, #fef9c3 100%);
    background-size: 800px 100%;
    animation: ntd-shimmer 1.4s ease-in-out infinite;
  }
`;

interface BookImageProps extends Omit<ImageProps, 'onLoad'> {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
}

/**
 * Drop-in replacement for `next/image` on book covers.
 * - Shows a golden shimmer skeleton while loading
 * - Caches loaded image in the browser Cache API
 * - Subsequent renders skip the shimmer if image is already cached
 */
export function BookImage({ src, alt, className, wrapperClassName, ...props }: BookImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [precached, setPrecached] = useState(false);
  const didCache = useRef(false);

  // Check if already cached on mount
  useEffect(() => {
    isImageCached(src).then(cached => {
      if (cached) setPrecached(true);
    });
  }, [src]);

  const handleLoad = () => {
    setLoaded(true);
    if (!didCache.current) {
      didCache.current = true;
      cacheImage(src);
    }
  };

  const showShimmer = !loaded && !precached;

  return (
    <>
      {/* Inject shimmer keyframes once */}
      <style dangerouslySetInnerHTML={{ __html: shimmerStyle }} />

      <div className={cn('relative overflow-hidden', wrapperClassName)}>
        {/* Golden shimmer skeleton */}
        {showShimmer && (
          <div
            className="ntd-shimmer absolute inset-0 z-10 rounded-inherit"
            aria-hidden="true"
          />
        )}

        <Image
          src={src}
          alt={alt}
          onLoad={handleLoad}
          className={cn(
            'transition-opacity duration-500',
            loaded || precached ? 'opacity-100' : 'opacity-0',
            className,
          )}
          {...props}
        />
      </div>
    </>
  );
}
