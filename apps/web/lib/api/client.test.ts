import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ApiError,
  handleResponse,
  getAuthHeaders,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
} from './client';

// Mock storage module
vi.mock('../auth/storage', () => ({
  getAccessToken: vi.fn(),
  clearTokens: vi.fn(),
}));

import { getAccessToken, clearTokens } from '../auth/storage';

const mockGetAccessToken = vi.mocked(getAccessToken);
const mockClearTokens = vi.mocked(clearTokens);

describe('ApiError', () => {
  it('should create an error with status and code', () => {
    // Arrange
    const message = 'Not found';
    const status = 404;
    const code = 'NOT_FOUND';

    // Act
    const error = new ApiError(message, status, code);

    // Assert
    expect(error.message).toBe(message);
    expect(error.status).toBe(status);
    expect(error.code).toBe(code);
    expect(error.name).toBe('ApiError');
  });

  it('should use default code when not provided', () => {
    // Arrange & Act
    const error = new ApiError('Error', 500);

    // Assert
    expect(error.code).toBe('UNKNOWN_ERROR');
  });
});

describe('getAuthHeaders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return headers with Authorization when token exists', () => {
    // Arrange
    mockGetAccessToken.mockReturnValue('test-token');

    // Act
    const headers = getAuthHeaders();

    // Assert
    expect(headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token',
    });
  });

  it('should return headers without Authorization when token is null', () => {
    // Arrange
    mockGetAccessToken.mockReturnValue(null);

    // Act
    const headers = getAuthHeaders();

    // Assert
    expect(headers).toEqual({
      'Content-Type': 'application/json',
    });
  });
});

describe('handleResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return parsed JSON for successful response', async () => {
    // Arrange
    const mockData = { id: '1', name: 'Test' };
    const response = new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    // Act
    const result = await handleResponse<typeof mockData>(response);

    // Assert
    expect(result).toEqual(mockData);
  });

  it('should return undefined for 204 No Content response', async () => {
    // Arrange
    const response = new Response(null, { status: 204 });

    // Act
    const result = await handleResponse<void>(response);

    // Assert
    expect(result).toBeUndefined();
  });

  it('should clear tokens and throw error for 401 response', async () => {
    // Arrange
    const response = new Response(JSON.stringify({ detail: 'Unauthorized' }), {
      status: 401,
    });

    // Act & Assert
    await expect(handleResponse(response)).rejects.toThrow(ApiError);
    expect(mockClearTokens).toHaveBeenCalled();
  });

  it('should throw ApiError with message from detail for error response', async () => {
    // Arrange
    const response = new Response(JSON.stringify({ detail: 'Project not found' }), { status: 404 });

    // Act & Assert
    await expect(handleResponse(response)).rejects.toThrow('Project not found');
  });

  it('should handle validation errors array from Pydantic', async () => {
    // Arrange
    const response = new Response(
      JSON.stringify({
        detail: [
          { loc: ['body', 'title'], msg: 'required' },
          { loc: ['body', 'key'], msg: 'invalid format' },
        ],
      }),
      { status: 422 }
    );

    // Act & Assert
    try {
      await handleResponse(response);
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).message).toContain('title: required');
      expect((error as ApiError).message).toContain('key: invalid format');
      expect((error as ApiError).code).toBe('VALIDATION_ERROR');
    }
  });

  it('should use default error message when response has no detail', async () => {
    // Arrange
    const response = new Response(JSON.stringify({}), { status: 500 });

    // Act & Assert
    await expect(handleResponse(response)).rejects.toThrow('エラーが発生しました');
  });
});

describe('API request functions', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAccessToken.mockReturnValue('test-token');
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('apiGet', () => {
    it('should make GET request with auth headers', async () => {
      // Arrange
      const mockData = { id: '1' };
      global.fetch = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify(mockData), { status: 200 }));

      // Act
      const result = await apiGet<typeof mockData>('/api/v1/test');

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('apiPost', () => {
    it('should make POST request with body', async () => {
      // Arrange
      const requestData = { title: 'Test' };
      const responseData = { id: '1', title: 'Test' };
      global.fetch = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify(responseData), { status: 201 }));

      // Act
      const result = await apiPost<typeof responseData>('/api/v1/test', requestData);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
        })
      );
      expect(result).toEqual(responseData);
    });

    it('should handle POST without body', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

      // Act
      await apiPost('/api/v1/test');

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: undefined,
        })
      );
    });
  });

  describe('apiPut', () => {
    it('should make PUT request with body', async () => {
      // Arrange
      const requestData = { title: 'Updated' };
      global.fetch = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify(requestData), { status: 200 }));

      // Act
      await apiPut('/api/v1/test/1', requestData);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/test/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(requestData),
        })
      );
    });
  });

  describe('apiPatch', () => {
    it('should make PATCH request with body', async () => {
      // Arrange
      const requestData = { new_order: 2 };
      global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

      // Act
      await apiPatch('/api/v1/test/1', requestData);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/test/1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(requestData),
        })
      );
    });
  });

  describe('apiDelete', () => {
    it('should make DELETE request', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

      // Act
      await apiDelete('/api/v1/test/1');

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/test/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });
});
