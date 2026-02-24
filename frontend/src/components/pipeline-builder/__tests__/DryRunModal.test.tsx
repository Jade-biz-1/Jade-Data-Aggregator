import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// jest.mock is hoisted — use jest.fn() directly inside factories
jest.mock('reactflow', () => ({}));

jest.mock('@/services/pipelineBuilderService', () => ({
  pipelineBuilderService: {
    dryRunPipeline: jest.fn(),
  },
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, variant }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} data-variant={variant}>
      {children}
    </button>
  ),
}));

// Import AFTER mocks so we get the mocked module
import { DryRunModal } from '../DryRunModal';
import { pipelineBuilderService } from '@/services/pipelineBuilderService';

const mockDryRunPipeline = pipelineBuilderService.dryRunPipeline as jest.Mock;

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  pipelineId: 42,
  nodes: [{ id: 'node1', position: { x: 0, y: 0 }, data: { label: 'My Source' } }],
  edges: [],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DryRunModal', () => {
  describe('visibility', () => {
    it('returns null when isOpen is false', () => {
      const { container } = render(<DryRunModal {...defaultProps} isOpen={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders the modal when isOpen is true', () => {
      render(<DryRunModal {...defaultProps} />);
      expect(screen.getByText('Dry-Run Test')).toBeInTheDocument();
    });
  });

  describe('initial state', () => {
    it('shows the header description', () => {
      render(<DryRunModal {...defaultProps} />);
      expect(screen.getByText(/Test your pipeline with sample data/i)).toBeInTheDocument();
    });

    it('shows the "Start Dry-Run" button initially', () => {
      render(<DryRunModal {...defaultProps} />);
      expect(screen.getByText('Start Dry-Run')).toBeInTheDocument();
    });

    it('shows a Close button', () => {
      render(<DryRunModal {...defaultProps} />);
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('shows four informational bullet points about dry-run', () => {
      render(<DryRunModal {...defaultProps} />);
      expect(screen.getByText(/Processes sample data through your pipeline/i)).toBeInTheDocument();
      expect(screen.getByText(/Tests node configurations and connections/i)).toBeInTheDocument();
      expect(screen.getByText(/Does not save results to destinations/i)).toBeInTheDocument();
      expect(screen.getByText(/Helps identify issues before full execution/i)).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClose when the X button is clicked', () => {
      const onClose = jest.fn();
      render(<DryRunModal {...defaultProps} onClose={onClose} />);
      // The X icon button has no text content
      const buttons = screen.getAllByRole('button');
      const closeIconButton = buttons.find(b => !b.textContent?.trim());
      fireEvent.click(closeIconButton!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when the "Close" text button is clicked', () => {
      const onClose = jest.fn();
      render(<DryRunModal {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByText('Close'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('disables the Start Dry-Run button when pipelineId is null', () => {
      render(<DryRunModal {...defaultProps} pipelineId={null} />);
      const button = screen.getByText('Start Dry-Run').closest('button');
      expect(button).toBeDisabled();
    });

    it('calls dryRunPipeline with correct arguments', async () => {
      mockDryRunPipeline.mockResolvedValue({
        status: 'success',
        message: 'All clear',
        node_results: [],
        total_records: 100,
      });

      render(<DryRunModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Start Dry-Run'));

      await waitFor(() =>
        expect(mockDryRunPipeline).toHaveBeenCalledWith(
          42,
          defaultProps.nodes,
          defaultProps.edges
        )
      );
    });
  });

  describe('success state', () => {
    beforeEach(() => {
      mockDryRunPipeline.mockResolvedValue({
        status: 'success',
        message: 'Pipeline validated',
        node_results: [
          { node_id: 'node1', status: 'success', records_processed: 50 },
        ],
        total_records: 50,
      });
    });

    it('shows "Dry-run completed successfully" on success', async () => {
      render(<DryRunModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Start Dry-Run'));
      await waitFor(() =>
        expect(screen.getByText('Dry-run completed successfully')).toBeInTheDocument()
      );
    });

    it('shows the success message from API response', async () => {
      render(<DryRunModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Start Dry-Run'));
      await waitFor(() =>
        expect(screen.getByText('Pipeline validated')).toBeInTheDocument()
      );
    });

    it('shows total records processed', async () => {
      render(<DryRunModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Start Dry-Run'));
      await waitFor(() =>
        expect(screen.getByText('Total records processed: 50')).toBeInTheDocument()
      );
    });

    it('shows node results section', async () => {
      render(<DryRunModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Start Dry-Run'));
      await waitFor(() =>
        expect(screen.getByText('Node Results')).toBeInTheDocument()
      );
    });

    it('shows node label from nodes array', async () => {
      render(<DryRunModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Start Dry-Run'));
      await waitFor(() =>
        expect(screen.getByText('My Source')).toBeInTheDocument()
      );
    });

    it('shows records processed for each node', async () => {
      render(<DryRunModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Start Dry-Run'));
      await waitFor(() =>
        expect(screen.getByText('50 records')).toBeInTheDocument()
      );
    });

    it('shows "Run Again" button after completion', async () => {
      render(<DryRunModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Start Dry-Run'));
      await waitFor(() =>
        expect(screen.getByText('Run Again')).toBeInTheDocument()
      );
    });
  });

  describe('failure state', () => {
    it('shows "Dry-run failed" when API returns failed status', async () => {
      mockDryRunPipeline.mockResolvedValue({
        status: 'failed',
        message: 'Connection refused',
        node_results: [],
      });
      render(<DryRunModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Start Dry-Run'));
      await waitFor(() =>
        expect(screen.getByText('Dry-run failed')).toBeInTheDocument()
      );
      expect(screen.getByText('Connection refused')).toBeInTheDocument();
    });

    it('shows failure when API call throws an error', async () => {
      mockDryRunPipeline.mockRejectedValue(new Error('Network error'));
      render(<DryRunModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Start Dry-Run'));
      await waitFor(() =>
        expect(screen.getByText('Dry-run failed')).toBeInTheDocument()
      );
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('shows node error message for failed nodes', async () => {
      mockDryRunPipeline.mockResolvedValue({
        status: 'failed',
        node_results: [
          { node_id: 'node1', status: 'failed', error: 'Invalid config' },
        ],
      });
      render(<DryRunModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Start Dry-Run'));
      await waitFor(() =>
        expect(screen.getByText('Invalid config')).toBeInTheDocument()
      );
    });
  });
});
