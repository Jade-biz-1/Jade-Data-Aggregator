import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BaseChartContainer } from '../base-chart';

describe('BaseChartContainer', () => {
  describe('normal state', () => {
    it('renders children when not loading and no error', () => {
      render(
        <BaseChartContainer>
          <div data-testid="chart-content">Chart here</div>
        </BaseChartContainer>
      );
      expect(screen.getByTestId('chart-content')).toBeInTheDocument();
    });

    it('applies the default minHeight of 300px', () => {
      const { container } = render(
        <BaseChartContainer>
          <span>content</span>
        </BaseChartContainer>
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.minHeight).toBe('300px');
    });

    it('applies a custom minHeight when provided', () => {
      const { container } = render(
        <BaseChartContainer minHeight="500px">
          <span>content</span>
        </BaseChartContainer>
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.minHeight).toBe('500px');
    });
  });

  describe('loading state', () => {
    it('does not render children when isLoading is true', () => {
      render(
        <BaseChartContainer isLoading>
          <div data-testid="chart-content">Chart</div>
        </BaseChartContainer>
      );
      expect(screen.queryByTestId('chart-content')).not.toBeInTheDocument();
    });

    it('renders a spinner element when isLoading', () => {
      const { container } = render(<BaseChartContainer isLoading><span /></BaseChartContainer>);
      // The spinner has animate-spin class
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('applies minHeight to the loading container', () => {
      const { container } = render(
        <BaseChartContainer isLoading minHeight="400px">
          <span />
        </BaseChartContainer>
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.minHeight).toBe('400px');
    });
  });

  describe('error state', () => {
    it('does not render children when error is provided', () => {
      render(
        <BaseChartContainer error="Something went wrong">
          <div data-testid="chart-content">Chart</div>
        </BaseChartContainer>
      );
      expect(screen.queryByTestId('chart-content')).not.toBeInTheDocument();
    });

    it('shows the error message when error prop is set', () => {
      render(
        <BaseChartContainer error="Failed to load data">
          <span />
        </BaseChartContainer>
      );
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });

    it('applies minHeight to the error container', () => {
      const { container } = render(
        <BaseChartContainer error="Oops" minHeight="250px">
          <span />
        </BaseChartContainer>
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.minHeight).toBe('250px');
    });

    it('renders children when error is null', () => {
      render(
        <BaseChartContainer error={null}>
          <div data-testid="child">content</div>
        </BaseChartContainer>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  describe('priority: loading takes precedence over error', () => {
    it('shows loading spinner when both isLoading and error are set', () => {
      const { container } = render(
        <BaseChartContainer isLoading error="Some error">
          <span />
        </BaseChartContainer>
      );
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
      expect(screen.queryByText('Some error')).not.toBeInTheDocument();
    });
  });
});
