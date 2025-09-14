// src/hooks/useAuth.js
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateIdempotencyKey } from '../utils/idempotency';

const API_URL = 'https://your-api-endpoint.com'; // Replace with your API

const useAuth = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      // For demo purposes, return a mock user
      // In production, this would fetch from your API
      return {
        id: 'user123',
        email: 'demo@flow.app',
        name: 'Demo User',
        avatar: null,
        createdAt: '2024-01-01T00:00:00Z',
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password, idempotencyKey }) => {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error('Login failed');
      const data = await response.json();
      await AsyncStorage.setItem('authToken', data.token);
      return data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['auth'], user);
      setError(null);
    },
    onError: (err) => setError(err.message),
  });

  const registerMutation = useMutation({
    mutationFn: async ({ name, email, password, idempotencyKey, acceptTerms, marketingOptIn }) => {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ name, email, password, acceptTerms, marketingOptIn }),
      });
      if (!response.ok) throw new Error('Registration failed');
      const data = await response.json();
      await AsyncStorage.setItem('authToken', data.token);
      return data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['auth'], user);
      setError(null);
    },
    onError: (err) => setError(err.message),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ email }) => {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error('Password reset failed');
      return response.json();
    },
    onError: (err) => setError(err.message),
  });

  const skipAuth = () => {
    // Set the mock user for demo purposes
    queryClient.setQueryData(['auth'], {
      id: 'user123',
      email: 'demo@flow.app',
      name: 'Demo User',
      avatar: null,
      createdAt: '2024-01-01T00:00:00Z',
    });
    setError(null);
  };

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    skipAuth,
  };
};

export { useAuth };
export default useAuth;