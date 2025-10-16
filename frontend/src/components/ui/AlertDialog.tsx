/**
 * Custom Alert Dialog Component
 * Replaces native browser alert() for better UX
 * Phase 9A-2: Frontend API Consolidation
 */

import React from 'react';

export interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  buttonText?: string;
  onClose: () => void;
}

export function AlertDialog({
  isOpen,
  title,
  message,
  type = 'info',
  buttonText = 'OK',
  onClose,
}: AlertDialogProps) {
  if (!isOpen) return null;

  const getIconAndColors = () => {
    switch (type) {
      case 'success':
        return {
          icon: (
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          iconBg: 'bg-green-100',
          buttonClass: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        };
      case 'warning':
        return {
          icon: (
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          iconBg: 'bg-yellow-100',
          buttonClass: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
        };
      case 'error':
        return {
          icon: (
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          iconBg: 'bg-red-100',
          buttonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        };
      default: // info
        return {
          icon: (
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          iconBg: 'bg-blue-100',
          buttonClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        };
    }
  };

  const { icon, iconBg, buttonClass } = getIconAndColors();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
          {/* Content */}
          <div className="px-6 py-4">
            <div className="flex items-start">
              {/* Icon */}
              <div className={`flex-shrink-0 ${iconBg} rounded-full p-2`}>
                {icon}
              </div>

              {/* Text */}
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-700 whitespace-pre-line">{message}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonClass}`}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Custom hook for easier alert dialog management
 *
 * Usage:
 * const { showAlert, AlertDialogComponent } = useAlertDialog();
 *
 * const handleSuccess = () => {
 *   showAlert({
 *     title: 'Success',
 *     message: 'Operation completed successfully!',
 *     type: 'success'
 *   });
 * };
 */
export function useAlertDialog() {
  const [dialogState, setDialogState] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    buttonText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const showAlert = React.useCallback(
    (options: Omit<AlertDialogProps, 'isOpen' | 'onClose'>) => {
      setDialogState({
        ...options,
        isOpen: true,
      });
    },
    []
  );

  const handleClose = React.useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const AlertDialogComponent = React.useMemo(
    () => (
      <AlertDialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        buttonText={dialogState.buttonText}
        onClose={handleClose}
      />
    ),
    [
      dialogState.isOpen,
      dialogState.title,
      dialogState.message,
      dialogState.type,
      dialogState.buttonText,
      handleClose,
    ]
  );

  return { showAlert, AlertDialogComponent };
}
