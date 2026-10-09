/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { EventCategory, resolveBannerUrl, getCategoryFallbackBanner } from '../store';

interface EventBannerImageProps {
  src?: string;
  category?: EventCategory;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export function EventBannerImage({
  src,
  category,
  alt,
  className = 'w-full h-full object-cover',
  style,
}: EventBannerImageProps) {
  const initialUrl = resolveBannerUrl(src, category);
  const [currentSrc, setCurrentSrc] = useState<string>(initialUrl);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentSrc(resolveBannerUrl(src, category));
    setHasError(false);
  }, [src, category]);

  // If gradient style
  if (currentSrc?.startsWith('linear-gradient')) {
    return (
      <div
        className={className}
        style={{ background: currentSrc, ...style }}
        role="img"
        aria-label={alt}
      />
    );
  }

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      // Fallback to trusted category preset asset
      const fallback = getCategoryFallbackBanner(category);
      if (fallback !== currentSrc) {
        setCurrentSrc(fallback);
      }
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  );
}
