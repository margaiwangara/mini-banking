import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export function useRecentTransactions() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['transactions', 'recent', token],
    queryFn: () => api.getRecentTransactions(token!),
    enabled: !!token,
  });
}

export function useTransactions(
  limit = 50,
  offset = 0,
  type?: string,
) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['transactions', 'list', token, limit, offset, type],
    queryFn: () => api.getTransactions(token!, limit, offset, type),
    enabled: !!token,
  });
}

export function useTransfer() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      description?: string;
    }) => api.transfer(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transfer completed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Transfer failed');
    },
  });
}

export function useExchange() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      description?: string;
    }) => api.exchange(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Exchange completed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Exchange failed');
    },
  });
}
