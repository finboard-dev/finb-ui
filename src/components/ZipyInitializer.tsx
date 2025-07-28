'use client';

import { useEffect } from 'react';

export default function ZipyInitializer() {
  useEffect(() => {
    // Initialize zipyai
    const initZipy = async () => {
      try {
        const zipy = (await import('zipyai')).default;
        zipy.init('4836b34c');
      } catch (error) {
        console.error('Failed to initialize zipyai:', error);
      }
    };

    initZipy();
  }, []);

  return null;
}
