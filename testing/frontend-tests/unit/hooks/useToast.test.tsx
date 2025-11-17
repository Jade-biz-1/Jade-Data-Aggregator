/**
 * useToast Hook Tests
 * Tests toast management, notification creation, and removal
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useToast } from '@/hooks/useToast';

describe('useToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with empty toasts array', () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.toasts).toEqual([]);
    });

    it('should provide all toast methods', () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.addToast).toBeDefined();
      expect(result.current.removeToast).toBeDefined();
      expect(result.current.success).toBeDefined();
      expect(result.current.error).toBeDefined();
      expect(result.current.warning).toBeDefined();
      expect(result.current.info).toBeDefined();
    });
  });

  describe('Adding Toasts', () => {
    it('should add a toast with addToast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast({
          type: 'success',
          message: 'Test message',
          title: 'Test title',
        });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        type: 'success',
        message: 'Test message',
        title: 'Test title',
      });
    });

    it('should generate unique IDs for toasts', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast({ type: 'info', message: 'Message 1' });
        result.current.addToast({ type: 'info', message: 'Message 2' });
      });

      expect(result.current.toasts).toHaveLength(2);
      expect(result.current.toasts[0].id).toBeDefined();
      expect(result.current.toasts[1].id).toBeDefined();
      expect(result.current.toasts[0].id).not.toBe(result.current.toasts[1].id);
    });

    it('should use default duration of 5000ms', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast({ type: 'info', message: 'Test' });
      });

      expect(result.current.toasts[0].duration).toBe(5000);
    });

    it('should use custom duration when provided', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast({
          type: 'info',
          message: 'Test',
          duration: 3000,
        });
      });

      expect(result.current.toasts[0].duration).toBe(3000);
    });

    it('should return toast ID when adding', () => {
      const { result } = renderHook(() => useToast());

      let toastId: string = '';
      act(() => {
        toastId = result.current.addToast({ type: 'success', message: 'Test' });
      });

      expect(toastId).toBeTruthy();
      expect(result.current.toasts[0].id).toBe(toastId);
    });
  });

  describe('Success Toasts', () => {
    it('should create success toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Operation successful');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].type).toBe('success');
      expect(result.current.toasts[0].message).toBe('Operation successful');
    });

    it('should create success toast with title', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Data saved', 'Success');
      });

      expect(result.current.toasts[0].title).toBe('Success');
      expect(result.current.toasts[0].message).toBe('Data saved');
    });

    it('should create success toast with custom duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Quick message', undefined, 1000);
      });

      expect(result.current.toasts[0].duration).toBe(1000);
    });
  });

  describe('Error Toasts', () => {
    it('should create error toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.error('Operation failed');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].type).toBe('error');
      expect(result.current.toasts[0].message).toBe('Operation failed');
    });

    it('should create error toast with title', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.error('Network error occurred', 'Error');
      });

      expect(result.current.toasts[0].title).toBe('Error');
      expect(result.current.toasts[0].message).toBe('Network error occurred');
    });
  });

  describe('Warning Toasts', () => {
    it('should create warning toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.warning('Please check your input');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].type).toBe('warning');
      expect(result.current.toasts[0].message).toBe('Please check your input');
    });

    it('should create warning toast with title and duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.warning('Session expiring soon', 'Warning', 8000);
      });

      expect(result.current.toasts[0].title).toBe('Warning');
      expect(result.current.toasts[0].duration).toBe(8000);
    });
  });

  describe('Info Toasts', () => {
    it('should create info toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.info('New feature available');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].type).toBe('info');
      expect(result.current.toasts[0].message).toBe('New feature available');
    });

    it('should create info toast with all parameters', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.info('Update available', 'Information', 6000);
      });

      expect(result.current.toasts[0]).toMatchObject({
        type: 'info',
        title: 'Information',
        message: 'Update available',
        duration: 6000,
      });
    });
  });

  describe('Removing Toasts', () => {
    it('should remove toast by ID', () => {
      const { result } = renderHook(() => useToast());

      let toastId: string = '';
      act(() => {
        toastId = result.current.success('Test message');
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.removeToast(toastId);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('should remove correct toast when multiple exist', () => {
      const { result } = renderHook(() => useToast());

      let id1: string = '';
      let id2: string = '';
      let id3: string = '';

      act(() => {
        id1 = result.current.success('Message 1');
        id2 = result.current.error('Message 2');
        id3 = result.current.warning('Message 3');
      });

      expect(result.current.toasts).toHaveLength(3);

      act(() => {
        result.current.removeToast(id2);
      });

      expect(result.current.toasts).toHaveLength(2);
      expect(result.current.toasts.find(t => t.id === id1)).toBeDefined();
      expect(result.current.toasts.find(t => t.id === id2)).toBeUndefined();
      expect(result.current.toasts.find(t => t.id === id3)).toBeDefined();
    });

    it('should handle removing non-existent toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Test');
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.removeToast('non-existent-id');
      });

      expect(result.current.toasts).toHaveLength(1);
    });
  });

  describe('Multiple Toasts', () => {
    it('should handle multiple toasts of different types', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Success message');
        result.current.error('Error message');
        result.current.warning('Warning message');
        result.current.info('Info message');
      });

      expect(result.current.toasts).toHaveLength(4);
      expect(result.current.toasts[0].type).toBe('success');
      expect(result.current.toasts[1].type).toBe('error');
      expect(result.current.toasts[2].type).toBe('warning');
      expect(result.current.toasts[3].type).toBe('info');
    });

    it('should maintain toast order', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('First');
        result.current.error('Second');
        result.current.warning('Third');
      });

      expect(result.current.toasts[0].message).toBe('First');
      expect(result.current.toasts[1].message).toBe('Second');
      expect(result.current.toasts[2].message).toBe('Third');
    });
  });

  describe('Toast onClose Callback', () => {
    it('should include onClose callback in toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Test');
      });

      expect(result.current.toasts[0].onClose).toBeDefined();
      expect(typeof result.current.toasts[0].onClose).toBe('function');
    });

    it('should remove toast when onClose is called', () => {
      const { result } = renderHook(() => useToast());

      let toastId: string = '';
      act(() => {
        toastId = result.current.success('Test');
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.toasts[0].onClose!(toastId);
      });

      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('Hook Stability', () => {
    it('should maintain function references across renders', () => {
      const { result, rerender } = renderHook(() => useToast());

      const initialFunctions = {
        addToast: result.current.addToast,
        removeToast: result.current.removeToast,
        success: result.current.success,
        error: result.current.error,
        warning: result.current.warning,
        info: result.current.info,
      };

      rerender();

      expect(result.current.addToast).toBe(initialFunctions.addToast);
      expect(result.current.removeToast).toBe(initialFunctions.removeToast);
      expect(result.current.success).toBe(initialFunctions.success);
      expect(result.current.error).toBe(initialFunctions.error);
      expect(result.current.warning).toBe(initialFunctions.warning);
      expect(result.current.info).toBe(initialFunctions.info);
    });
  });
});
