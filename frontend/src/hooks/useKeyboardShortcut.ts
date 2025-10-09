'use client';

import { useEffect, useCallback } from 'react';

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // Command key on Mac
  callback: (event: KeyboardEvent) => void;
  description?: string;
  preventDefault?: boolean;
}

export const useKeyboardShortcut = (shortcuts: ShortcutConfig | ShortcutConfig[]) => {
  const shortcutArray = Array.isArray(shortcuts) ? shortcuts : [shortcuts];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcutArray) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.callback(event);
          break;
        }
      }
    },
    [shortcutArray]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

export default useKeyboardShortcut;
