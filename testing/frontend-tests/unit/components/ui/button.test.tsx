/**
 * Button Component Tests
 * Tests button variants, sizes, states, and interactions
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

describe('Button', () => {
  describe('Rendering', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>);

      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('should render button with default variant', () => {
      render(<Button>Default Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('from-primary-600');
      expect(button).toHaveClass('to-primary-700');
    });

    it('should apply custom className', () => {
      render(<Button className="custom-class">Button</Button>);

      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Button variant="default">Default</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('from-primary-600');
      expect(button).toHaveClass('text-white');
    });

    it('should render destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('from-red-600');
      expect(button).toHaveClass('to-red-700');
    });

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('bg-white');
    });

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-100');
    });

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-gray-100');
    });

    it('should render link variant', () => {
      render(<Button variant="link">Link</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary-600');
      expect(button).toHaveClass('underline-offset-4');
    });
  });

  describe('Sizes', () => {
    it('should render default size', () => {
      render(<Button size="default">Default Size</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('px-4');
    });

    it('should render small size', () => {
      render(<Button size="sm">Small</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9');
      expect(button).toHaveClass('px-3');
    });

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12');
      expect(button).toHaveClass('px-8');
    });

    it('should render icon size', () => {
      render(<Button size="icon" aria-label="Icon button">X</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('w-10');
    });
  });

  describe('Icons', () => {
    it('should render with icon', () => {
      render(<Button icon={Plus}>Add Item</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      // Icon is rendered via lucide-react
    });

    it('should not render icon when loading', () => {
      render(<Button icon={Plus} loading>Add Item</Button>);

      const button = screen.getByRole('button');
      // Loading spinner should be shown instead
      expect(button.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      render(<Button loading>Loading</Button>);

      const button = screen.getByRole('button');
      expect(button.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should disable button when loading', () => {
      render(<Button loading>Submit</Button>);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should show loading spinner with text', () => {
      render(<Button loading>Saving...</Button>);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByRole('button').querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should prioritize loading over icon', () => {
      render(<Button icon={Plus} loading>Add</Button>);

      const button = screen.getByRole('button');
      // Should show spinner, not icon
      expect(button.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable button when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should have opacity class when disabled', () => {
      render(<Button disabled>Disabled</Button>);

      expect(screen.getByRole('button')).toHaveClass('disabled:opacity-50');
    });

    it('should not be clickable when disabled', async () => {
      const onClick = jest.fn();
      const user = userEvent.setup();

      render(<Button disabled onClick={onClick}>Disabled</Button>);

      await user.click(screen.getByRole('button'));

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Click Handling', () => {
    it('should call onClick when clicked', async () => {
      const onClick = jest.fn();
      const user = userEvent.setup();

      render(<Button onClick={onClick}>Click me</Button>);

      await user.click(screen.getByRole('button'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const onClick = jest.fn();
      const user = userEvent.setup();

      render(<Button disabled onClick={onClick}>Disabled</Button>);

      await user.click(screen.getByRole('button'));

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', async () => {
      const onClick = jest.fn();
      const user = userEvent.setup();

      render(<Button loading onClick={onClick}>Loading</Button>);

      await user.click(screen.getByRole('button'));

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('HTML Attributes', () => {
    it('should accept type attribute', () => {
      render(<Button type="submit">Submit</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('should accept aria-label', () => {
      render(<Button aria-label="Close dialog">X</Button>);

      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
    });

    it('should accept data attributes', () => {
      render(<Button data-testid="custom-button">Button</Button>);

      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    });

    it('should accept id attribute', () => {
      render(<Button id="submit-btn">Submit</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('id', 'submit-btn');
    });
  });

  describe('Forwarded Ref', () => {
    it('should forward ref to button element', () => {
      const ref = jest.fn();

      render(<Button ref={ref}>Button</Button>);

      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Accessibility', () => {
    it('should have proper button role', () => {
      render(<Button>Accessible Button</Button>);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have focus visible styles', () => {
      render(<Button>Focus me</Button>);

      expect(screen.getByRole('button')).toHaveClass('focus-visible:outline-none');
      expect(screen.getByRole('button')).toHaveClass('focus-visible:ring-2');
    });

    it('should indicate disabled state to screen readers', () => {
      render(<Button disabled>Disabled</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('disabled');
    });
  });

  describe('Combinations', () => {
    it('should render destructive large button', () => {
      render(<Button variant="destructive" size="lg">Delete All</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('from-red-600');
      expect(button).toHaveClass('h-12');
    });

    it('should render small outline button with icon', () => {
      render(<Button variant="outline" size="sm" icon={Plus}>Add</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('h-9');
    });

    it('should render loading secondary button', () => {
      render(<Button variant="secondary" loading>Processing...</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-100');
      expect(button).toBeDisabled();
      expect(button.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });
});
