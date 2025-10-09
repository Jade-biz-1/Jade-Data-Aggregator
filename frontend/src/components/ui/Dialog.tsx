'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import Modal from './Modal';

export type DialogType = 'info' | 'success' | 'warning' | 'error';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  type?: DialogType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showCancelButton?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type = 'info',
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showCancelButton = true,
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const icons = {
    info: <Info className="w-6 h-6 text-blue-500" />,
    success: <CheckCircle className="w-6 h-6 text-green-500" />,
    warning: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
    error: <XCircle className="w-6 h-6 text-red-500" />,
  };

  const colors = {
    info: 'bg-blue-50 dark:bg-blue-900/20',
    success: 'bg-green-50 dark:bg-green-900/20',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20',
    error: 'bg-red-50 dark:bg-red-900/20',
  };

  const buttonColors = {
    info: 'bg-blue-600 hover:bg-blue-700',
    success: 'bg-green-600 hover:bg-green-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    error: 'bg-red-600 hover:bg-red-700',
  };

  const footer = (
    <>
      {showCancelButton && (
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          {cancelText}
        </button>
      )}
      <button
        onClick={handleConfirm}
        className={`px-4 py-2 text-white rounded-lg transition-colors ${buttonColors[type]}`}
      >
        {confirmText}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      footer={footer}
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 p-3 rounded-full ${colors[type]}`}>
          {icons[type]}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
        </div>
      </div>
    </Modal>
  );
};

export default Dialog;
