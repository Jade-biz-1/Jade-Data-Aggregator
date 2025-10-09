'use client';

import React, { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import Modal from './Modal';

export interface Shortcut {
  keys: string[];
  description: string;
  category?: string;
}

export interface KeyboardShortcutHelperProps {
  shortcuts: Shortcut[];
}

export const KeyboardShortcutHelper: React.FC<KeyboardShortcutHelperProps> = ({
  shortcuts,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  const formatKey = (key: string) => {
    const keyMap: Record<string, string> = {
      ctrl: 'Ctrl',
      cmd: '⌘',
      meta: '⌘',
      shift: '⇧',
      alt: '⌥',
      enter: '↵',
      backspace: '⌫',
      delete: '⌦',
      escape: 'Esc',
      arrowup: '↑',
      arrowdown: '↓',
      arrowleft: '←',
      arrowright: '→',
    };

    return keyMap[key.toLowerCase()] || key.toUpperCase();
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-30 p-3 bg-gray-800 dark:bg-gray-700 text-white rounded-full shadow-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
        aria-label="Show keyboard shortcuts"
        title="Keyboard Shortcuts (Shift + ?)"
      >
        <Keyboard className="w-5 h-5" />
      </button>

      {/* Shortcuts Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Keyboard Shortcuts"
        size="lg"
      >
        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          {keyIndex > 0 && (
                            <span className="text-gray-400 dark:text-gray-600 mx-1">
                              +
                            </span>
                          )}
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
                            {formatKey(key)}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
};

export default KeyboardShortcutHelper;
