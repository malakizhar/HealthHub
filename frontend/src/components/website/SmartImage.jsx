import { useState } from 'react';
import { IMAGE_FALLBACK } from '../../data/images';

export default function SmartImage({ src, alt = '', className = '', ...props }) {
  const [current, setCurrent] = useState(src);

  return (
    <img
      {...props}
      src={current}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => {
        if (current !== IMAGE_FALLBACK) setCurrent(IMAGE_FALLBACK);
      }}
    />
  );
}
