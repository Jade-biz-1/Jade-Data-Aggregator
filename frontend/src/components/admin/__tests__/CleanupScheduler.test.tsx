import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CleanupScheduler, CleanupScheduleConfig } from '../CleanupScheduler';

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children }: any) => <span>{children}</span>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ type, value, onChange, disabled, min, max }: any) => (
    <input
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      min={min}
      max={max}
    />
  ),
}));

const enabledConfig: CleanupScheduleConfig = {
  enabled: true,
  activity_log_retention_days: 90,
  execution_log_retention_days: 30,
  temp_file_retention_hours: 24,
  orphaned_data_check_days: 7,
  vacuum_frequency_days: 7,
  session_cleanup_hours: 24,
};

const disabledConfig: CleanupScheduleConfig = {
  ...enabledConfig,
  enabled: false,
};

describe('CleanupScheduler', () => {
  describe('loading state', () => {
    it('shows loading skeleton when loading=true', () => {
      const { container } = render(<CleanupScheduler loading />);
      const pulse = container.querySelector('.animate-pulse');
      expect(pulse).toBeInTheDocument();
    });

    it('does not render form fields when loading', () => {
      render(<CleanupScheduler loading />);
      expect(screen.queryByText('Cleanup Schedule Configuration')).not.toBeInTheDocument();
    });
  });

  describe('default config', () => {
    it('renders "Cleanup Schedule Configuration" title', () => {
      render(<CleanupScheduler />);
      expect(screen.getByText('Cleanup Schedule Configuration')).toBeInTheDocument();
    });

    it('shows "Automatic Cleanup" toggle label', () => {
      render(<CleanupScheduler />);
      expect(screen.getByText('Automatic Cleanup')).toBeInTheDocument();
    });

    it('shows warning when automatic cleanup is disabled (default)', () => {
      render(<CleanupScheduler />);
      expect(screen.getByText('Automatic cleanup is disabled')).toBeInTheDocument();
    });

    it('shows default activity log retention value (90)', () => {
      render(<CleanupScheduler />);
      expect(screen.getByText('Keep logs for 90 days')).toBeInTheDocument();
    });

    it('shows default execution log retention value (30)', () => {
      render(<CleanupScheduler />);
      expect(screen.getByText('Keep logs for 30 days')).toBeInTheDocument();
    });

    it('shows default temp file retention value (24 hours)', () => {
      render(<CleanupScheduler />);
      expect(screen.getByText('Delete files older than 24 hours')).toBeInTheDocument();
    });
  });

  describe('initialConfig prop', () => {
    it('shows no warning when enabled=true', () => {
      render(<CleanupScheduler initialConfig={enabledConfig} />);
      expect(screen.queryByText('Automatic cleanup is disabled')).not.toBeInTheDocument();
    });

    it('displays the enabled config values', () => {
      render(<CleanupScheduler initialConfig={enabledConfig} />);
      expect(screen.getByText('Keep logs for 90 days')).toBeInTheDocument();
    });
  });

  describe('toggle behavior', () => {
    it('removes warning when toggle is clicked to enable', () => {
      render(<CleanupScheduler />);
      expect(screen.getByText('Automatic cleanup is disabled')).toBeInTheDocument();
      const toggleButton = screen.getByRole('button', { name: '' });
      fireEvent.click(toggleButton);
      expect(screen.queryByText('Automatic cleanup is disabled')).not.toBeInTheDocument();
    });

    it('shows warning when toggle is clicked to disable on enabled config', () => {
      render(<CleanupScheduler initialConfig={enabledConfig} />);
      const toggleButton = screen.getByRole('button', { name: '' });
      fireEvent.click(toggleButton);
      expect(screen.getByText('Automatic cleanup is disabled')).toBeInTheDocument();
    });
  });

  describe('save behavior', () => {
    it('shows "Save Schedule" button', () => {
      render(<CleanupScheduler />);
      expect(screen.getByText('Save Schedule')).toBeInTheDocument();
    });

    it('Save Schedule button is disabled when no changes', () => {
      render(<CleanupScheduler />);
      const saveButton = screen.getByText('Save Schedule').closest('button');
      expect(saveButton).toBeDisabled();
    });

    it('shows "Unsaved changes" after making a change', () => {
      render(<CleanupScheduler />);
      // Toggle to trigger a change
      const toggleButton = screen.getByRole('button', { name: '' });
      fireEvent.click(toggleButton);
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });

    it('Save Schedule button is enabled after making a change', () => {
      render(<CleanupScheduler />);
      const toggleButton = screen.getByRole('button', { name: '' });
      fireEvent.click(toggleButton);
      const saveButton = screen.getByText('Save Schedule').closest('button');
      expect(saveButton).not.toBeDisabled();
    });

    it('calls onSave with current config when Save is clicked', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      render(<CleanupScheduler onSave={onSave} />);
      // Make a change first
      const toggleButton = screen.getByRole('button', { name: '' });
      fireEvent.click(toggleButton);
      fireEvent.click(screen.getByText('Save Schedule'));
      await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
    });

    it('shows "Settings saved successfully" after successful save', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      render(<CleanupScheduler onSave={onSave} />);
      const toggleButton = screen.getByRole('button', { name: '' });
      fireEvent.click(toggleButton);
      fireEvent.click(screen.getByText('Save Schedule'));
      await waitFor(() =>
        expect(screen.getByText('Settings saved successfully')).toBeInTheDocument()
      );
    });
  });

  describe('reset behavior', () => {
    it('shows Reset button after making a change', () => {
      render(<CleanupScheduler />);
      const toggleButton = screen.getByRole('button', { name: '' });
      fireEvent.click(toggleButton);
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });

    it('Reset button hides after resetting', () => {
      render(<CleanupScheduler />);
      const toggleButton = screen.getByRole('button', { name: '' });
      fireEvent.click(toggleButton);
      fireEvent.click(screen.getByText('Reset'));
      expect(screen.queryByText('Reset')).not.toBeInTheDocument();
    });

    it('restores original config after reset', () => {
      render(<CleanupScheduler />);
      const toggleButton = screen.getByRole('button', { name: '' });
      fireEvent.click(toggleButton);
      // Warning gone (enabled)
      expect(screen.queryByText('Automatic cleanup is disabled')).not.toBeInTheDocument();
      fireEvent.click(screen.getByText('Reset'));
      // Warning back (disabled)
      expect(screen.getByText('Automatic cleanup is disabled')).toBeInTheDocument();
    });
  });
});
