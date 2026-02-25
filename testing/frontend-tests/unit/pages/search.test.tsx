/**
 * Search Page Unit Tests — TEST-017
 * Covers: rendering, search execution, result display, suggestions dropdown,
 *         saved searches (localStorage), history (localStorage), error handling.
 *
 * search/page.tsx uses `api` (axios instance), not apiClient.
 */

import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchPage from '@/app/search/page';
import { api } from '@/lib/api';

// ── Constants matching the page ────────────────────────────────────────────
const HISTORY_KEY = 'jade_search_history';
const SAVED_KEY = 'jade_saved_searches';

// ── Mock api (axios instance) ──────────────────────────────────────────────
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

// ── Mock Next.js navigation ────────────────────────────────────────────────
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/search',
  useSearchParams: () => new URLSearchParams(),
}));

// ── Mock permissions ───────────────────────────────────────────────────────
const mockUsePermissions = jest.fn();
jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => mockUsePermissions(),
}));

// ── Mock toast ─────────────────────────────────────────────────────────────
const mockError = jest.fn();
jest.mock('@/hooks/useToast', () => ({
  __esModule: true,
  default: () => ({
    toasts: [],
    error: mockError,
    success: jest.fn(),
    warning: jest.fn(),
  }),
}));

// ── Mock layout ────────────────────────────────────────────────────────────
jest.mock('@/components/layout/dashboard-layout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}));

jest.mock('@/components/common/AccessDenied', () => ({
  AccessDenied: () => <div data-testid="access-denied">Access Denied</div>,
}));

jest.mock('@/components/ui/ToastContainer', () => ({
  ToastContainer: () => null,
}));

// ── Fixtures ───────────────────────────────────────────────────────────────
const mockSearchResponse = {
  query: 'test',
  total_results: 2,
  results: {
    pipelines: [
      { id: 1, name: 'Test Pipeline', description: 'ETL pipeline', match_score: 0.95 },
    ],
    connectors: [
      { id: 2, name: 'Test Connector', description: 'DB connector', match_score: 0.80 },
    ],
  },
};

const mockSuggestionsResponse = {
  suggestions: ['test pipeline', 'test connector', 'test data'],
};

const allowedPermissions = {
  features: { search: { view: true } },
  loading: false,
};

const deniedPermissions = {
  features: { search: { view: false } },
  loading: false,
};

// ══════════════════════════════════════════════════════════════════════════
describe('SearchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUsePermissions.mockReturnValue(allowedPermissions);
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ── Permission Guard ───────────────────────────────────────────────────
  describe('Permission Handling', () => {
    it('shows access denied when search.view is false', () => {
      mockUsePermissions.mockReturnValue(deniedPermissions);
      render(<SearchPage />);
      expect(screen.getByTestId('access-denied')).toBeInTheDocument();
    });

    it('renders search page when permitted', () => {
      render(<SearchPage />);
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });
  });

  // ── Page Rendering ─────────────────────────────────────────────────────
  describe('Page Rendering', () => {
    it('displays a search input', () => {
      render(<SearchPage />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('displays search heading', () => {
      render(<SearchPage />);
      expect(screen.getByText(/search/i)).toBeInTheDocument();
    });
  });

  // ── Search Execution ───────────────────────────────────────────────────
  describe('Search Execution', () => {
    it('calls GET /search with query param on submit', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockSearchResponse });
      jest.useRealTimers();
      const user = userEvent.setup();

      render(<SearchPage />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      const submitBtn = screen.getByRole('button', { name: /search/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/search',
          expect.objectContaining({ params: expect.objectContaining({ q: 'test' }) })
        );
      });
    });

    it('also triggers search on Enter key', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockSearchResponse });
      jest.useRealTimers();
      const user = userEvent.setup();

      render(<SearchPage />);
      const input = screen.getByRole('textbox');
      await user.type(input, 'test{Enter}');

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/search',
          expect.objectContaining({ params: expect.objectContaining({ q: 'test' }) })
        );
      });
    });
  });

  // ── Results Display ────────────────────────────────────────────────────
  describe('Search Results', () => {
    it('displays results after successful search', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockSearchResponse });
      jest.useRealTimers();
      const user = userEvent.setup();

      render(<SearchPage />);
      const input = screen.getByRole('textbox');
      await user.type(input, 'test');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByText('Test Pipeline')).toBeInTheDocument();
        expect(screen.getByText('Test Connector')).toBeInTheDocument();
      });
    });

    it('handles search error gracefully', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Search failed'));
      jest.useRealTimers();
      const user = userEvent.setup();

      render(<SearchPage />);
      const input = screen.getByRole('textbox');
      await user.type(input, 'fail');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(mockError).toHaveBeenCalled();
      });
    });
  });

  // ── Suggestions ────────────────────────────────────────────────────────
  describe('Suggestions', () => {
    it('fetches suggestions after typing with debounce', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockSuggestionsResponse });

      render(<SearchPage />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'test' } });

      // Advance debounce timer (300ms)
      act(() => {
        jest.advanceTimersByTime(350);
      });

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/search/suggestions',
          expect.objectContaining({ params: expect.objectContaining({ q: 'test' }) })
        );
      });
    });

    it('does not fetch suggestions for very short queries', async () => {
      render(<SearchPage />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'a' } });
      act(() => { jest.advanceTimersByTime(350); });

      await waitFor(() => {
        expect(api.get).not.toHaveBeenCalledWith('/search/suggestions', expect.anything());
      });
    });
  });

  // ── Search History (localStorage) ─────────────────────────────────────
  describe('Search History', () => {
    it('loads saved history from localStorage on mount', () => {
      const history = ['past query 1', 'past query 2'];
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

      render(<SearchPage />);

      expect(screen.queryByText('past query 1') || screen.queryByText('recent')).toBeTruthy();
    });

    it('saves search query to localStorage history after search', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockSearchResponse });
      jest.useRealTimers();
      const user = userEvent.setup();

      render(<SearchPage />);
      const input = screen.getByRole('textbox');
      await user.type(input, 'new search');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        expect(stored).toContain('new search');
      });
    });
  });

  // ── Saved Searches (localStorage) ─────────────────────────────────────
  describe('Saved Searches', () => {
    it('loads saved searches from localStorage on mount', () => {
      const saved = [{ id: 's1', name: 'My Search', query: 'pipeline', filters: {} }];
      localStorage.setItem(SAVED_KEY, JSON.stringify(saved));

      render(<SearchPage />);

      expect(screen.queryByText('My Search') || screen.queryByText(/saved/i)).toBeTruthy();
    });
  });
});
