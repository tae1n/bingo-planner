import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '../theme';

describe('useThemeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'light' });
    document.documentElement.dataset.theme = 'light';
  });

  it('초기 테마 light', () => {
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('toggle: light → dark', () => {
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('toggle 두 번: light → dark → light', () => {
    useThemeStore.getState().toggle();
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().theme).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
