import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserRoleSelector } from '../UserRoleSelector';

jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

const mockRolesResponse = {
  roles: [
    { role: 'admin', title: 'Administrator', description: 'Full access', level: 100 },
    { role: 'developer', title: 'Developer', description: 'Dev access', level: 80 },
    { role: 'viewer', title: 'Viewer', description: 'Read only', level: 10 },
  ],
};

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => mockRolesResponse,
  });
});

describe('UserRoleSelector', () => {
  it('shows loading state initially', async () => {
    // Make fetch slow to see loading state
    mockFetch.mockImplementation(() => new Promise(() => {}));
    render(<UserRoleSelector value="" onChange={jest.fn()} />);
    expect(screen.getByText('Loading roles...')).toBeInTheDocument();
  });

  it('fetches roles from /api/v1/roles on mount', async () => {
    render(<UserRoleSelector value="" onChange={jest.fn()} />);
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/roles', { credentials: 'include' })
    );
  });

  it('renders roles in select dropdown after fetch', async () => {
    render(<UserRoleSelector value="" onChange={jest.fn()} />);
    await waitFor(() =>
      expect(screen.getByText('Administrator - Full access')).toBeInTheDocument()
    );
    expect(screen.getByText('Developer - Dev access')).toBeInTheDocument();
    expect(screen.getByText('Viewer - Read only')).toBeInTheDocument();
  });

  it('shows "Select a role..." placeholder option', async () => {
    render(<UserRoleSelector value="" onChange={jest.fn()} />);
    await waitFor(() => expect(screen.getByText('Select a role...')).toBeInTheDocument());
  });

  it('calls onChange when a role is selected', async () => {
    const onChange = jest.fn();
    render(<UserRoleSelector value="" onChange={onChange} />);
    await waitFor(() => screen.getByText('Select a role...'));
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'admin' } });
    expect(onChange).toHaveBeenCalledWith('admin');
  });

  it('renders select as disabled when disabled prop is true', async () => {
    render(<UserRoleSelector value="" onChange={jest.fn()} disabled />);
    await waitFor(() => screen.getByText('Select a role...'));
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('shows role description when showDescription=true and a role is selected', async () => {
    render(<UserRoleSelector value="viewer" onChange={jest.fn()} showDescription={true} />);
    await waitFor(() => screen.getByText('Select a role...'));
    expect(screen.getByText('Viewer')).toBeInTheDocument();
    expect(screen.getByText('Read only')).toBeInTheDocument();
    expect(screen.getByText('Level: 10')).toBeInTheDocument();
  });

  it('shows developer warning when developer role is selected', async () => {
    render(<UserRoleSelector value="developer" onChange={jest.fn()} />);
    await waitFor(() => screen.getByText('Select a role...'));
    expect(screen.getByText('Production Warning')).toBeInTheDocument();
    expect(screen.getByText(/Developer role is restricted in production/i)).toBeInTheDocument();
  });

  it('does not show developer warning for non-developer roles', async () => {
    render(<UserRoleSelector value="viewer" onChange={jest.fn()} />);
    await waitFor(() => screen.getByText('Select a role...'));
    expect(screen.queryByText('Production Warning')).not.toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    mockFetch.mockResolvedValue({ ok: false });
    render(<UserRoleSelector value="" onChange={jest.fn()} />);
    await waitFor(() =>
      expect(screen.getByText('Failed to fetch roles')).toBeInTheDocument()
    );
  });

  it('shows error message when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network down'));
    render(<UserRoleSelector value="" onChange={jest.fn()} />);
    await waitFor(() =>
      expect(screen.getByText('Network down')).toBeInTheDocument()
    );
  });
});
