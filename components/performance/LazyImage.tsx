/**
 * Optimized Lazy Loading Image Component
 * With blur placeholder and intersection observer
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Image, { ImageProps } from 'next/image';

interface LazyImageProps extends Omit<ImageProps, 'onLoad'> {
  lowQualitySrc?: string;
}

export function LazyImage({ src, lowQualitySrc, alt, ...props }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={props.className}>
      {isInView && (
        <Image
          {...props}
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${props.className || ''}`}
        />
      )}
      {!isLoaded && lowQualitySrc && (
        <Image
          {...props}
          src={lowQualitySrc}
          alt={alt}
          className="blur-sm"
        />
      )}
    </div>
  );
}
