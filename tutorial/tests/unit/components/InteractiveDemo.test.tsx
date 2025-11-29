import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InteractiveDemo } from '@/components/tutorial/InteractiveDemo';

// Mock UI components
jest.mock('@/components/ui/Card', () => ({ children }: any) => <div>{children}</div>);
jest.mock('@/components/ui/Button', () => ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
));
jest.mock('@/components/ui/Alert', () => ({ children }: any) => <div role="alert">{children}</div>);
jest.mock('@/components/ui/Tabs', () => {
    const Tabs = ({ children }: any) => <div>{children}</div>;
    const TabsList = ({ children }: any) => <div>{children}</div>;
    const TabsTrigger = ({ children, value, onClick }: any) => (
        <button onClick={onClick} data-value={value}>{children}</button>
    );
    const TabsContent = ({ children, value }: any) => (
        <div data-content={value}>{children}</div>
    );
    return { __esModule: true, default: Tabs, TabsList, TabsTrigger, TabsContent };
});

// Mock CodeBlock since it might use syntax highlighting libraries
jest.mock('@/components/tutorial/CodeBlock', () => ({
    CodeBlock: () => <div data-testid="code-block">Code Block</div>
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
    Play: () => <span>IconPlay</span>,
    RotateCcw: () => <span>IconReset</span>,
    Code2: () => <span>IconCode</span>,
    Eye: () => <span>IconPreview</span>,
}));

describe('InteractiveDemo', () => {
    const defaultProps = {
        title: 'Test Demo',
        description: 'A test demo',
        code: 'console.log("test")',
        children: <div>Demo Content</div>,
    };

    it('renders correctly', () => {
        render(<InteractiveDemo {...defaultProps} />);

        expect(screen.getByText('Test Demo')).toBeInTheDocument();
        expect(screen.getByText('A test demo')).toBeInTheDocument();
        expect(screen.getByText('Demo Content')).toBeInTheDocument();
    });

    it('handles run action', async () => {
        const onRun = jest.fn();
        render(<InteractiveDemo {...defaultProps} onRun={onRun} />);

        fireEvent.click(screen.getByText('Run'));

        expect(onRun).toHaveBeenCalled();
        // Should show running state (mocked or checked via text if visible)
    });

    it('handles reset action', () => {
        const onReset = jest.fn();
        render(<InteractiveDemo {...defaultProps} onReset={onReset} />);

        fireEvent.click(screen.getByText('Reset'));

        expect(onReset).toHaveBeenCalled();
    });

    it('displays instructions when provided', () => {
        render(<InteractiveDemo {...defaultProps} instructions="Do this" />);

        expect(screen.getByText('Instructions:')).toBeInTheDocument();
        expect(screen.getByText('Do this')).toBeInTheDocument();
    });
});
