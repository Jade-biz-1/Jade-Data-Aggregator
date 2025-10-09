'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  shortcut?: string;
}

export interface ContextMenuProps {
  items: ContextMenuItem[];
  children: React.ReactNode;
  disabled?: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  children,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (disabled) return;

    e.preventDefault();
    e.stopPropagation();

    const x = e.clientX;
    const y = e.clientY;

    setPosition({ x, y });
    setIsOpen(true);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);

      // Adjust position if menu goes off screen
      if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect();
        const newPosition = { ...position };

        if (rect.right > window.innerWidth) {
          newPosition.x = window.innerWidth - rect.width - 8;
        }
        if (rect.bottom > window.innerHeight) {
          newPosition.y = window.innerHeight - rect.height - 8;
        }

        setPosition(newPosition);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('contextmenu', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
    }
  };

  return (
    <>
      <div ref={triggerRef} onContextMenu={handleContextMenu}>
        {children}
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[200px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 py-1 animate-scaleIn"
          style={{ top: `${position.y}px`, left: `${position.x}px` }}
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
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                    item.disabled
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : item.danger
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  role="menuitem"
                >
                  <span className="flex items-center gap-3">
                    {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                    <span>{item.label}</span>
                  </span>
                  {item.shortcut && (
                    <span className="text-xs text-gray-400 dark:text-gray-600 ml-4">
                      {item.shortcut}
                    </span>
                  )}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </>
  );
};

export default ContextMenu;
