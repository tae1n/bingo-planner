import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '@/store/auth';

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking fetch
import { toImageUrl, api, apiUpload } from '../api';

describe('toImageUrl', () => {
  it('절대 URL 패스스루', () => {
    expect(toImageUrl('https://example.com/img.png')).toBe('https://example.com/img.png');
    expect(toImageUrl('http://example.com/img.png')).toBe('http://example.com/img.png');
  });

  it('상대 경로 → API_HOST + path', () => {
    const result = toImageUrl('/uploads/img.png');
    expect(result).toBe('http://localhost:4000/uploads/img.png');
  });
});

describe('api', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    useAuthStore.setState({ accessToken: null, refreshToken: null, user: null });
  });

  it('성공 응답 파싱', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: 'hello' }),
    });

    const result = await api('/test');
    expect(result).toEqual({ data: 'hello' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/v1/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('에러 응답 throw', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'Bad request' }),
    });

    await expect(api('/test')).rejects.toThrow('Bad request');
  });

  it('에러 body 파싱 실패 시 fallback 메시지', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('parse error')),
    });

    await expect(api('/test')).rejects.toThrow('API error 500');
  });

  it('토큰 있으면 Authorization 헤더 포함', async () => {
    useAuthStore.setState({ accessToken: 'my-token', refreshToken: null, user: null });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await api('/test');
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer my-token');
  });

  it('토큰 없으면 Authorization 헤더 없음', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await api('/test');
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.Authorization).toBeUndefined();
  });
});

describe('apiUpload', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    useAuthStore.setState({ accessToken: 'token', refreshToken: null, user: null });
  });

  it('FormData 성공 전송', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ url: '/uploads/img.png' }),
    });

    const formData = new FormData();
    formData.append('file', new Blob(['test']), 'test.png');

    const result = await apiUpload('/upload', formData);
    expect(result).toEqual({ url: '/uploads/img.png' });
  });

  it('Content-Type 미설정 (브라우저가 자동 설정)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await apiUpload('/upload', new FormData());
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers['Content-Type']).toBeUndefined();
  });

  it('업로드 실패 시 에러 throw', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 413,
      json: () => Promise.resolve({ message: 'File too large' }),
    });

    await expect(apiUpload('/upload', new FormData())).rejects.toThrow('File too large');
  });
});
