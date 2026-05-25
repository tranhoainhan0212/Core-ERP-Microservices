import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useToastManager } from '../useToastManager';

describe('useToastManager', () => {
  it('adds and removes toasts', () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useToastManager());

    act(() => {
      result.current.addToast('Saved successfully', 'success');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].text).toBe('Saved successfully');

    act(() => {
      vi.advanceTimersByTime(4500);
    });

    expect(result.current.toasts).toHaveLength(0);

    vi.useRealTimers();
  });
});
