import { useEffect, useRef } from 'react';

interface ScannerOptions {
  onScan: (barcode: string) => void;
  minChars?: number;
  maxIntervalMs?: number;
}

/**
 * Catches keystrokes from USB Barcode Scanners (e.g. Honeywell, Zebra, Datalogic).
 * Scanners behave like very fast keyboards, typing characters within < 30-50ms intervals
 * followed by an Enter key.
 */
export const useBarcodeScanner = ({
  onScan,
  minChars = 3,
  maxIntervalMs = 60
}: ScannerOptions) => {
  const bufferRef = useRef<string>('');
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in standard text inputs/textareas unless intended
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea';

      const now = performance.now();
      const diff = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minChars) {
          e.preventDefault();
          const scanned = bufferRef.current;
          bufferRef.current = '';
          onScan(scanned);
        } else {
          bufferRef.current = '';
        }
        return;
      }

      // If key is single printable char
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // If time between keystrokes was too long, reset buffer (unless in dedicated scanner input)
        if (diff > maxIntervalMs && !isInput) {
          bufferRef.current = '';
        }
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan, minChars, maxIntervalMs]);
};
