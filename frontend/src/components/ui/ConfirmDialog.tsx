'use client';

import React from 'react';
import Dialog, { DialogProps } from './Dialog';

export interface ConfirmDialogProps extends Omit<DialogProps, 'type'> {
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  variant = 'warning',
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  ...props
}) => {
  const typeMap = {
    danger: 'error' as const,
    warning: 'warning' as const,
    info: 'info' as const,
  };

  return (
    <Dialog
      {...props}
      type={typeMap[variant]}
      title={title}
      message={message}
      confirmText={confirmText}
      cancelText={cancelText}
    />
  );
};

export default ConfirmDialog;
