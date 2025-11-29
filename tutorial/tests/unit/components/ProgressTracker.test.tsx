import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProgressTracker, ModuleProgress } from '@/components/tutorial/ProgressTracker';

// Mock UI components
jest.mock('@/components/ui/Card', () => {
    return function MockCard({ children, className }: any) {
        return <div data-testid="card" className={className}>{children}</div>;
    };
});

jest.mock('@/components/ui/Progress', () => {
    return function MockProgress({ value, className }: any) {
        return <div data-testid="progress" data-value={value} className={className} />;
    };
});

jest.mock('@/components/ui/Badge', () => {
    return function MockBadge({ children, variant, className }: any) {
        return <div data-testid="badge" data-variant={variant} className={className}>{children}</div>;
    };
});

// Mock Lucide icons
jest.mock('lucide-react', () => ({
    CheckCircle: () => <span data-testid="icon-check" />,
    Circle: () => <span data-testid="icon-circle" />,
    Lock: () => <span data-testid="icon-lock" />,
}));

const mockModules: ModuleProgress[] = [
    {
        id: 'module-1',
        title: 'Module 1',
        completed: false,
        lessons: [
            { id: 'l1', title: 'Lesson 1', completed: true, locked: false },
            { id: 'l2', title: 'Lesson 2', completed: false, locked: false },
        ],
    },
    {
        id: 'module-2',
        title: 'Module 2',
        completed: false,
        lessons: [
            { id: 'l3', title: 'Lesson 3', completed: false, locked: true },
        ],
    },
];

describe('ProgressTracker', () => {
    it('renders correctly with initial progress', () => {
        render(<ProgressTracker modules={mockModules} />);

        // Check module titles
        expect(screen.getByText('Module 1')).toBeInTheDocument();
        expect(screen.getByText('Module 2')).toBeInTheDocument();

        // Check lesson titles
        expect(screen.getByText('Lesson 1')).toBeInTheDocument();
        expect(screen.getByText('Lesson 2')).toBeInTheDocument();
        expect(screen.getByText('Lesson 3')).toBeInTheDocument();

        // Check progress calculation (1 completed out of 3 total = 33%)
        expect(screen.getByText('33%')).toBeInTheDocument();
        expect(screen.getByText('1 of 3 lessons completed')).toBeInTheDocument();
    });

    it('handles lesson clicks correctly', () => {
        const handleLessonClick = jest.fn();
        render(
            <ProgressTracker
                modules={mockModules}
                onLessonClick={handleLessonClick}
            />
        );

        // Click unlocked lesson
        fireEvent.click(screen.getByText('Lesson 2'));
        expect(handleLessonClick).toHaveBeenCalledWith('l2');

        // Click locked lesson
        fireEvent.click(screen.getByText('Lesson 3'));
        expect(handleLessonClick).not.toHaveBeenCalledWith('l3');
    });

    it('highlights current lesson', () => {
        render(
            <ProgressTracker
                modules={mockModules}
                currentLessonId="l2"
            />
        );

        const lessonButton = screen.getByText('Lesson 2').closest('button');
        expect(lessonButton).toHaveClass('bg-primary-50');
    });
});
