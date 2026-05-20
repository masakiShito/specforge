/**
 * Token storage utilities
 * Handles secure storage of authentication tokens
 */

const ACCESS_TOKEN_KEY = "specforge_access_token";
const REFRESH_TOKEN_KEY = "specforge_refresh_token";

/**
 * Check if we're running in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Store access token
 */
export function setAccessToken(token: string): void {
  if (isBrowser()) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
}

/**
 * Get stored access token
 */
export function getAccessToken(): string | null {
  if (isBrowser()) {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
}

/**
 * Remove access token
 */
export function removeAccessToken(): void {
  if (isBrowser()) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

/**
 * Store refresh token
 */
export function setRefreshToken(token: string): void {
  if (isBrowser()) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
}

/**
 * Get stored refresh token
 */
export function getRefreshToken(): string | null {
  if (isBrowser()) {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
}

/**
 * Remove refresh token
 */
export function removeRefreshToken(): void {
  if (isBrowser()) {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

/**
 * Store both tokens
 */
export function setTokens(accessToken: string, refreshToken: string): void {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
}

/**
 * Clear all tokens
 */
export function clearTokens(): void {
  removeAccessToken();
  removeRefreshToken();
}

/**
 * Check if user has stored tokens
 */
export function hasTokens(): boolean {
  return getAccessToken() !== null && getRefreshToken() !== null;
}
