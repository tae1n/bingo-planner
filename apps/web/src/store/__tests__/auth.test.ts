import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../auth';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
    });
  });

  it('초기 상태: 모두 null', () => {
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it('setAuth 호출 후 상태 설정', () => {
    const user = { id: 1, nickname: 'test', profileImageUrl: null };
    useAuthStore.getState().setAuth('access-token', 'refresh-token', user);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('access-token');
    expect(state.refreshToken).toBe('refresh-token');
    expect(state.user).toEqual(user);
  });

  it('logout 호출 후 상태 초기화', () => {
    const user = { id: 1, nickname: 'test', profileImageUrl: null };
    useAuthStore.getState().setAuth('access-token', 'refresh-token', user);
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });
});
