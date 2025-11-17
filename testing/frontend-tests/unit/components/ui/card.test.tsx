/**
 * Card Component Tests
 * Tests card structure, sub-components, and composition
 */

import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render card container', () => {
      render(<Card data-testid="card">Card Content</Card>);

      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should have default styling classes', () => {
      render(<Card data-testid="card">Content</Card>);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('rounded-xl');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('shadow-soft');
    });

    it('should accept custom className', () => {
      render(<Card className="custom-class" data-testid="card">Content</Card>);

      expect(screen.getByTestId('card')).toHaveClass('custom-class');
    });

    it('should render children', () => {
      render(<Card>This is card content</Card>);

      expect(screen.getByText('This is card content')).toBeInTheDocument();
    });

    it('should forward ref', () => {
      const ref = jest.fn();

      render(<Card ref={ref}>Content</Card>);

      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
    });

    it('should accept HTML attributes', () => {
      render(<Card id="main-card" data-testid="card">Content</Card>);

      expect(screen.getByTestId('card')).toHaveAttribute('id', 'main-card');
    });
  });

  describe('CardHeader', () => {
    it('should render card header', () => {
      render(<CardHeader data-testid="header">Header Content</CardHeader>);

      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('should have default styling', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);

      const header = screen.getByTestId('header');
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('flex-col');
      expect(header).toHaveClass('p-6');
    });

    it('should accept custom className', () => {
      render(<CardHeader className="custom-header" data-testid="header">Header</CardHeader>);

      expect(screen.getByTestId('header')).toHaveClass('custom-header');
    });

    it('should render children', () => {
      render(<CardHeader>Header Text</CardHeader>);

      expect(screen.getByText('Header Text')).toBeInTheDocument();
    });
  });

  describe('CardTitle', () => {
    it('should render card title as h3', () => {
      render(<CardTitle>Card Title</CardTitle>);

      const title = screen.getByText('Card Title');
      expect(title.tagName).toBe('H3');
    });

    it('should have default styling', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>);

      const title = screen.getByTestId('title');
      expect(title).toHaveClass('text-xl');
      expect(title).toHaveClass('font-bold');
      expect(title).toHaveClass('text-gray-900');
    });

    it('should accept custom className', () => {
      render(<CardTitle className="custom-title">Title</CardTitle>);

      expect(screen.getByText('Title')).toHaveClass('custom-title');
    });

    it('should render children', () => {
      render(<CardTitle>My Card Title</CardTitle>);

      expect(screen.getByText('My Card Title')).toBeInTheDocument();
    });
  });

  describe('CardDescription', () => {
    it('should render card description as paragraph', () => {
      render(<CardDescription>Card description text</CardDescription>);

      const description = screen.getByText('Card description text');
      expect(description.tagName).toBe('P');
    });

    it('should have default styling', () => {
      render(<CardDescription data-testid="description">Description</CardDescription>);

      const description = screen.getByTestId('description');
      expect(description).toHaveClass('text-sm');
      expect(description).toHaveClass('text-gray-500');
    });

    it('should accept custom className', () => {
      render(<CardDescription className="custom-desc">Description</CardDescription>);

      expect(screen.getByText('Description')).toHaveClass('custom-desc');
    });

    it('should render children', () => {
      render(<CardDescription>This is a card description</CardDescription>);

      expect(screen.getByText('This is a card description')).toBeInTheDocument();
    });
  });

  describe('CardContent', () => {
    it('should render card content', () => {
      render(<CardContent data-testid="content">Content goes here</CardContent>);

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should have default styling', () => {
      render(<CardContent data-testid="content">Content</CardContent>);

      const content = screen.getByTestId('content');
      expect(content).toHaveClass('p-6');
      expect(content).toHaveClass('pt-0');
    });

    it('should accept custom className', () => {
      render(<CardContent className="custom-content" data-testid="content">Content</CardContent>);

      expect(screen.getByTestId('content')).toHaveClass('custom-content');
    });

    it('should render children', () => {
      render(<CardContent>Main content area</CardContent>);

      expect(screen.getByText('Main content area')).toBeInTheDocument();
    });
  });

  describe('CardFooter', () => {
    it('should render card footer', () => {
      render(<CardFooter data-testid="footer">Footer content</CardFooter>);

      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('should have default styling', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);

      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('items-center');
      expect(footer).toHaveClass('p-6');
      expect(footer).toHaveClass('pt-0');
    });

    it('should accept custom className', () => {
      render(<CardFooter className="custom-footer" data-testid="footer">Footer</CardFooter>);

      expect(screen.getByTestId('footer')).toHaveClass('custom-footer');
    });

    it('should render children', () => {
      render(<CardFooter>Footer buttons</CardFooter>);

      expect(screen.getByText('Footer buttons')).toBeInTheDocument();
    });
  });

  describe('Card Composition', () => {
    it('should render complete card with all parts', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>This is a test card</CardDescription>
          </CardHeader>
          <CardContent>Main content here</CardContent>
          <CardFooter>Footer actions</CardFooter>
        </Card>
      );

      expect(screen.getByTestId('complete-card')).toBeInTheDocument();
      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('This is a test card')).toBeInTheDocument();
      expect(screen.getByText('Main content here')).toBeInTheDocument();
      expect(screen.getByText('Footer actions')).toBeInTheDocument();
    });

    it('should render card with only header and content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Simple Card</CardTitle>
          </CardHeader>
          <CardContent>Content only</CardContent>
        </Card>
      );

      expect(screen.getByText('Simple Card')).toBeInTheDocument();
      expect(screen.getByText('Content only')).toBeInTheDocument();
    });

    it('should render card with only content', () => {
      render(
        <Card>
          <CardContent>Just content</CardContent>
        </Card>
      );

      expect(screen.getByText('Just content')).toBeInTheDocument();
    });

    it('should support nested elements', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Nested Card</CardTitle>
            <CardDescription>With complex content</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <p>Paragraph 1</p>
              <p>Paragraph 2</p>
            </div>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
    });

    it('should support multiple cards', () => {
      render(
        <div>
          <Card data-testid="card-1">
            <CardTitle>Card 1</CardTitle>
          </Card>
          <Card data-testid="card-2">
            <CardTitle>Card 2</CardTitle>
          </Card>
        </div>
      );

      expect(screen.getByTestId('card-1')).toBeInTheDocument();
      expect(screen.getByTestId('card-2')).toBeInTheDocument();
    });
  });

  describe('Styling Customization', () => {
    it('should override default card styles', () => {
      render(<Card className="bg-blue-100 shadow-lg" data-testid="card">Content</Card>);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-blue-100');
      expect(card).toHaveClass('shadow-lg');
    });

    it('should combine default and custom header styles', () => {
      render(<CardHeader className="bg-gray-50" data-testid="header">Header</CardHeader>);

      const header = screen.getByTestId('header');
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('bg-gray-50');
    });

    it('should customize content padding', () => {
      render(<CardContent className="p-0" data-testid="content">No padding</CardContent>);

      expect(screen.getByTestId('content')).toHaveClass('p-0');
    });
  });

  describe('Accessibility', () => {
    it('should support aria attributes on card', () => {
      render(<Card aria-label="User profile card">Content</Card>);

      expect(screen.getByLabelText('User profile card')).toBeInTheDocument();
    });

    it('should maintain semantic heading structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Section Title</CardTitle>
          </CardHeader>
        </Card>
      );

      const heading = screen.getByText('Section Title');
      expect(heading.tagName).toBe('H3');
    });

    it('should support role attributes', () => {
      render(<Card role="article">Article content</Card>);

      expect(screen.getByRole('article')).toBeInTheDocument();
    });
  });
});
