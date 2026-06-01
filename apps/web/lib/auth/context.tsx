'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import type { AuthContextValue, AuthState, LoginCredentials, RegisterData } from './types';
import * as api from './api';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './storage';

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialState);

  // Initialize auth state from stored tokens
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();

      if (!accessToken || !refreshToken) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Try to get current user with stored token
        const user = await api.getCurrentUser(accessToken);
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } catch {
        // Token might be expired, try to refresh
        try {
          const tokens = await api.refreshToken(refreshToken);
          setTokens(tokens.access_token, tokens.refresh_token);
          const user = await api.getCurrentUser(tokens.access_token);
          setState({
            user,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        } catch {
          // Refresh failed, clear tokens
          clearTokens();
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: null,
          });
        }
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const tokens = await api.login(credentials);
      setTokens(tokens.access_token, tokens.refresh_token);

      const user = await api.getCurrentUser(tokens.access_token);
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof api.AuthApiError ? error.message : 'Login failed. Please try again.';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Register the user
      await api.register(data);

      // Auto-login after registration
      const tokens = await api.login({
        email: data.email,
        password: data.password,
      });
      setTokens(tokens.access_token, tokens.refresh_token);

      const user = await api.getCurrentUser(tokens.access_token);
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof api.AuthApiError
          ? error.message
          : 'Registration failed. Please try again.';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  }, []);

  const refreshAuth = useCallback(async () => {
    const refreshTokenValue = getRefreshToken();
    if (!refreshTokenValue) {
      logout();
      return;
    }

    try {
      const tokens = await api.refreshToken(refreshTokenValue);
      setTokens(tokens.access_token, tokens.refresh_token);

      const user = await api.getCurrentUser(tokens.access_token);
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch {
      logout();
    }
  }, [logout]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    refreshAuth,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
