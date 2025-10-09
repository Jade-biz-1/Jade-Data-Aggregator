'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DropdownMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: 'left' | 'right';
  disabled?: boolean;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  align = 'left',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleClickOutside = (e: MouseEvent) => {
    if (
      menuRef.current &&
      !menuRef.current.contains(e.target as Node) &&
      triggerRef.current &&
      !triggerRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleItemClick = (item: DropdownMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  return (
    <div className="relative inline-block" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="inline-flex items-center gap-2"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className={`absolute top-full mt-2 min-w-[200px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 py-1 animate-slideDown z-50 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          role="menu"
          aria-orientation="vertical"
        >
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {item.divider ? (
                <div className="my-1 border-t border-gray-200 dark:border-gray-700" role="separator" />
              ) : (
                <button
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${
                    item.disabled
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : item.danger
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  role="menuitem"
                >
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
