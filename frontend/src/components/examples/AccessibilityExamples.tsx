/**
 * Accessibility Examples - Demonstrating WCAG 2.1 AA Compliance
 *
 * This file demonstrates best practices for accessibility in the Data Aggregator Platform.
 * All components follow WCAG 2.1 AA guidelines.
 */

'use client';

import React, { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { useTour } from '@/hooks/useTour';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { useAnnouncer } from '@/hooks/useAnnouncer';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import {
  Modal,
  Dialog,
  ConfirmDialog,
  ToastContainer,
  InlineNotification,
  Banner,
  Tour,
  ContextMenu,
  DropdownMenu,
  KeyboardShortcutHelper,
} from '@/components/ui';
import { TourStep } from '@/components/ui/Tour';
import { Trash2, Edit, Copy, Download } from 'lucide-react';

/**
 * Example: Accessible Form
 * - Proper labels with htmlFor
 * - ARIA attributes
 * - Error messages with aria-describedby
 * - Required field indicators
 */
export const AccessibleFormExample = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { announce } = useAnnouncer();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      announce('Form submission failed: Email is required', 'assertive');
    } else {
      setError('');
      announce('Form submitted successfully', 'polite');
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Contact form">
      <div className="space-y-2">
        <label
          htmlFor="email-input"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email <span aria-label="required" className="text-red-500">*</span>
        </label>
        <input
          id="email-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-required="true"
          aria-invalid={!!error}
          aria-describedby={error ? 'email-error' : undefined}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && (
          <p id="email-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
      <button
        type="submit"
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Submit
      </button>
    </form>
  );
};

/**
 * Example: Accessible Modal with Focus Trap
 */
export const AccessibleModalExample = () => {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useFocusTrap(isOpen);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        aria-haspopup="dialog"
      >
        Open Modal
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Accessible Modal"
      >
        <div ref={modalRef as React.RefObject<HTMLDivElement>}>
          <p className="text-gray-600 dark:text-gray-400">
            This modal traps focus within itself and can be closed with the Escape key.
          </p>
          <button
            onClick={() => setIsOpen(false)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </Modal>
    </>
  );
};

/**
 * Example: Accessible Data Table
 * - Column headers with scope
 * - Row headers where appropriate
 * - Caption for context
 * - ARIA labels for actions
 */
export const AccessibleTableExample = () => {
  const data = [
    { id: 1, name: 'Pipeline 1', status: 'Active', records: 1234 },
    { id: 2, name: 'Pipeline 2', status: 'Inactive', records: 567 },
  ];

  return (
    <table className="w-full" role="table" aria-label="Pipelines list">
      <caption className="sr-only">List of data pipelines with their status and record counts</caption>
      <thead>
        <tr>
          <th scope="col" className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
            Name
          </th>
          <th scope="col" className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </th>
          <th scope="col" className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
            Records
          </th>
          <th scope="col" className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.id}>
            <th scope="row" className="px-4 py-2 text-sm text-gray-900 dark:text-white">
              {row.name}
            </th>
            <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  row.status === 'Active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                }`}
                role="status"
                aria-label={`Status: ${row.status}`}
              >
                {row.status}
              </span>
            </td>
            <td className="px-4 py-2 text-sm text-right text-gray-600 dark:text-gray-400">
              {row.records.toLocaleString()}
            </td>
            <td className="px-4 py-2 text-sm text-right">
              <button
                className="text-blue-600 hover:text-blue-700"
                aria-label={`Edit ${row.name}`}
              >
                <Edit className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/**
 * Example: Accessible Button with Loading State
 */
export const AccessibleButtonExample = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { announce } = useAnnouncer();

  const handleClick = () => {
    setIsLoading(true);
    announce('Loading data...', 'polite');

    setTimeout(() => {
      setIsLoading(false);
      announce('Data loaded successfully', 'polite');
    }, 2000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      aria-busy={isLoading}
      aria-live="polite"
      className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <span className="sr-only">Loading...</span>
          <span aria-hidden="true">Loading...</span>
        </>
      ) : (
        'Load Data'
      )}
    </button>
  );
};

/**
 * Example: Accessible Icon Button
 * - aria-label for screen readers
 * - Visible tooltip on hover
 */
export const AccessibleIconButtonExample = () => {
  return (
    <div className="flex gap-2">
      <button
        aria-label="Delete item"
        title="Delete"
        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
      >
        <Trash2 className="w-5 h-5" aria-hidden="true" />
      </button>
      <button
        aria-label="Copy item"
        title="Copy"
        className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
      >
        <Copy className="w-5 h-5" aria-hidden="true" />
      </button>
      <button
        aria-label="Download item"
        title="Download"
        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
      >
        <Download className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  );
};

/**
 * Example: Keyboard Shortcuts
 */
export const KeyboardShortcutExample = () => {
  const { success } = useToast();

  useKeyboardShortcut([
    {
      key: 's',
      ctrl: true,
      callback: () => success('Save triggered (Ctrl+S)'),
      description: 'Save',
    },
    {
      key: 'k',
      ctrl: true,
      callback: () => success('Search triggered (Ctrl+K)'),
      description: 'Search',
    },
  ]);

  const shortcuts = [
    { keys: ['Ctrl', 'S'], description: 'Save changes', category: 'General' },
    { keys: ['Ctrl', 'K'], description: 'Open search', category: 'Navigation' },
    { keys: ['Esc'], description: 'Close modal/dialog', category: 'Navigation' },
    { keys: ['Tab'], description: 'Navigate forward', category: 'Navigation' },
    { keys: ['Shift', 'Tab'], description: 'Navigate backward', category: 'Navigation' },
  ];

  return <KeyboardShortcutHelper shortcuts={shortcuts} />;
};

export default {
  AccessibleFormExample,
  AccessibleModalExample,
  AccessibleTableExample,
  AccessibleButtonExample,
  AccessibleIconButtonExample,
  KeyboardShortcutExample,
};
