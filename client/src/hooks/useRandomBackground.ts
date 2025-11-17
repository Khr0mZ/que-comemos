import { useState } from 'react';

const BACKGROUND_IMAGES = Array.from({ length: 12 }, (_, i) => `/bg${i + 1}.webp`);

export function useRandomBackground() {
  // Initialize with a random background image
  const [backgroundImage] = useState<string>(() => {
    const randomIndex = Math.floor(Math.random() * BACKGROUND_IMAGES.length);
    return BACKGROUND_IMAGES[randomIndex];
  });

  return backgroundImage;
}

