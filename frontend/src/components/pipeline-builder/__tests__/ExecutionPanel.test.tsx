import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// jest.mock is hoisted — use jest.fn() directly inside factories
jest.mock('reactflow', () => ({}));

jest.mock('@/services/pipelineBuilderService', () => ({
  pipelineBuilderService: {
    executePipeline: jest.fn(),
    cancelExecution: jest.fn(),
    getExecutionState: jest.fn(),
  },
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}));

// Import AFTER mocks so we get the mocked module
import { ExecutionPanel } from '../ExecutionPanel';
import { pipelineBuilderService } from '@/services/pipelineBuilderService';

const mockExecutePipeline = pipelineBuilderService.executePipeline as jest.Mock;
const mockCancelExecution = pipelineBuilderService.cancelExecution as jest.Mock;
const mockGetExecutionState = pipelineBuilderService.getExecutionState as jest.Mock;

const mockNodes = [
  { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Source Node' } },
];

const defaultProps = {
  pipelineId: 10,
  nodes: mockNodes,
  edges: [],
  isOpen: true,
  onToggle: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ExecutionPanel', () => {
  describe('closed state', () => {
    it('shows "Execution Panel" button when closed', () => {
      render(<ExecutionPanel {...defaultProps} isOpen={false} />);
      expect(screen.getByText('Execution Panel')).toBeInTheDocument();
    });

    it('calls onToggle when the closed-state button is clicked', () => {
      const onToggle = jest.fn();
      render(<ExecutionPanel {...defaultProps} isOpen={false} onToggle={onToggle} />);
      fireEvent.click(screen.getByText('Execution Panel'));
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('open state - initial render', () => {
    it('shows "Execution Status" heading when open', () => {
      render(<ExecutionPanel {...defaultProps} />);
      expect(screen.getByText('Execution Status')).toBeInTheDocument();
    });

    it('shows "Ready to Execute" as the initial status', () => {
      render(<ExecutionPanel {...defaultProps} />);
      expect(screen.getByText('Ready to Execute')).toBeInTheDocument();
    });

    it('shows "Execute Pipeline" button when idle', () => {
      render(<ExecutionPanel {...defaultProps} />);
      expect(screen.getByText('Execute Pipeline')).toBeInTheDocument();
    });

    it('disables "Execute Pipeline" button when pipelineId is null', () => {
      render(<ExecutionPanel {...defaultProps} pipelineId={null} />);
      const button = screen.getByText('Execute Pipeline').closest('button');
      expect(button).toBeDisabled();
    });

    it('shows idle help text', () => {
      render(<ExecutionPanel {...defaultProps} />);
      expect(screen.getByText(/Click "Execute Pipeline" to start/i)).toBeInTheDocument();
    });
  });

  describe('execution start', () => {
    it('calls executePipeline when Execute Pipeline clicked', async () => {
      mockExecutePipeline.mockResolvedValue({});
      render(<ExecutionPanel {...defaultProps} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Execute Pipeline'));
      });
      expect(mockExecutePipeline).toHaveBeenCalledWith(10, mockNodes, []);
    });

    it('shows "Execution in Progress" after execute', async () => {
      mockExecutePipeline.mockResolvedValue({});
      render(<ExecutionPanel {...defaultProps} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Execute Pipeline'));
      });
      expect(screen.getByText('Execution in Progress')).toBeInTheDocument();
    });

    it('shows "Cancel Execution" button while running', async () => {
      mockExecutePipeline.mockResolvedValue({});
      render(<ExecutionPanel {...defaultProps} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Execute Pipeline'));
      });
      expect(screen.getByText('Cancel Execution')).toBeInTheDocument();
    });
  });

  describe('cancellation', () => {
    it('calls cancelExecution when Cancel button clicked', async () => {
      mockExecutePipeline.mockResolvedValue({});
      mockCancelExecution.mockResolvedValue({});
      render(<ExecutionPanel {...defaultProps} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Execute Pipeline'));
      });
      await act(async () => {
        fireEvent.click(screen.getByText('Cancel Execution'));
      });
      expect(mockCancelExecution).toHaveBeenCalledWith(10);
    });

    it('shows "Execution Cancelled" status after cancel', async () => {
      mockExecutePipeline.mockResolvedValue({});
      mockCancelExecution.mockResolvedValue({});
      render(<ExecutionPanel {...defaultProps} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Execute Pipeline'));
      });
      await act(async () => {
        fireEvent.click(screen.getByText('Cancel Execution'));
      });
      expect(screen.getByText('Execution Cancelled')).toBeInTheDocument();
    });
  });

  describe('failed state', () => {
    it('shows "Execution Failed" when execute throws', async () => {
      mockExecutePipeline.mockRejectedValue(new Error('Timeout'));
      render(<ExecutionPanel {...defaultProps} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Execute Pipeline'));
      });
      expect(screen.getByText('Execution Failed')).toBeInTheDocument();
    });

    it('shows error message when execute throws', async () => {
      mockExecutePipeline.mockRejectedValue(new Error('Timeout'));
      render(<ExecutionPanel {...defaultProps} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Execute Pipeline'));
      });
      expect(screen.getByText('Timeout')).toBeInTheDocument();
    });
  });

  describe('node statuses from polling', () => {
    it('shows "Node Progress" section when nodeStatuses present after poll', async () => {
      mockExecutePipeline.mockResolvedValue({});
      mockGetExecutionState.mockResolvedValue({
        status: 'running',
        nodeStatuses: [
          { node_id: 'n1', status: 'completed', records_processed: 200 },
        ],
      });
      render(<ExecutionPanel {...defaultProps} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Execute Pipeline'));
      });
      await act(async () => {
        jest.advanceTimersByTime(2500);
      });
      await waitFor(() =>
        expect(screen.queryByText('Node Progress')).toBeInTheDocument()
      );
    });

    it('shows node label from nodes array after poll', async () => {
      mockExecutePipeline.mockResolvedValue({});
      mockGetExecutionState.mockResolvedValue({
        status: 'running',
        nodeStatuses: [{ node_id: 'n1', status: 'running' }],
      });
      render(<ExecutionPanel {...defaultProps} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Execute Pipeline'));
      });
      await act(async () => {
        jest.advanceTimersByTime(2500);
      });
      await waitFor(() =>
        expect(screen.queryByText('Source Node')).toBeInTheDocument()
      );
    });
  });

  describe('completed state from polling', () => {
    it('shows "Execution Completed" when state is completed after poll', async () => {
      mockExecutePipeline.mockResolvedValue({});
      mockGetExecutionState.mockResolvedValue({
        status: 'completed',
        recordsProcessed: 500,
      });
      render(<ExecutionPanel {...defaultProps} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Execute Pipeline'));
      });
      await act(async () => {
        jest.advanceTimersByTime(2500);
      });
      await waitFor(() =>
        expect(screen.queryByText('Execution Completed')).toBeInTheDocument()
      );
    });

    it('shows records processed count when provided from poll', async () => {
      mockExecutePipeline.mockResolvedValue({});
      mockGetExecutionState.mockResolvedValue({
        status: 'completed',
        recordsProcessed: 1234,
      });
      render(<ExecutionPanel {...defaultProps} />);
      await act(async () => {
        fireEvent.click(screen.getByText('Execute Pipeline'));
      });
      await act(async () => {
        jest.advanceTimersByTime(2500);
      });
      await waitFor(() =>
        expect(screen.queryByText(/Records processed: 1,234/i)).toBeInTheDocument()
      );
    });
  });
});
