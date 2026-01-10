'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { exchangeSchema, type ExchangeFormData } from '../lib/schemas';
import { useExchange } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface ExchangeFormProps {
  onExchange: () => void;
}

export default function ExchangeForm({ onExchange }: ExchangeFormProps) {
  const { data: accounts = [] } = useAccounts();
  const exchange = useExchange();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExchangeFormData>({
    resolver: zodResolver(exchangeSchema),
  });

  const fromAccountId = watch('fromAccountId');
  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccountId = watch('toAccountId');
  const toAccount = accounts.find((a) => a.id === toAccountId);
  const amount = watch('amount');

  const differentCurrencyAccounts = accounts.filter(
    (a) =>
      !fromAccountId ||
      a.id === fromAccountId ||
      a.currency !== fromAccount?.currency,
  );

  // Calculate exchange preview
  const [exchangePreview, setExchangePreview] = useState<{
    rate: string;
    result: string;
  } | null>(null);

  useEffect(() => {
    const calculatePreview = async () => {
      if (
        !fromAccount ||
        !toAccount ||
        !amount ||
        fromAccount.currency === toAccount.currency
      ) {
        setExchangePreview(null);
        return;
      }

      try {
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
          setExchangePreview(null);
          return;
        }

        const data = await api.calculateExchange(
          amountNum,
          fromAccount.currency,
          toAccount.currency,
        );
        setExchangePreview({ rate: data.rate, result: data.result });
      } catch (err) {
        setExchangePreview(null);
      }
    };

    calculatePreview();
  }, [fromAccount, toAccount, amount]);

  const onSubmit = async (data: ExchangeFormData) => {
    const fromAcc = accounts.find((a) => a.id === data.fromAccountId);
    const toAcc = accounts.find((a) => a.id === data.toAccountId);

    // Additional validation
    if (fromAcc && toAcc && fromAcc.currency === toAcc.currency) {
      toast.error('Exchange must be between accounts of different currencies');
      return;
    }

    const amountNum = parseFloat(data.amount);
    if (fromAcc && amountNum > parseFloat(fromAcc.balance)) {
      toast.error('Insufficient funds');
      return;
    }

    try {
      await exchange.mutateAsync({
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        amount: amountNum,
        description: data.description,
      });
      reset();
      onExchange();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Exchange Currency
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="fromAccount"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            From Account
          </label>
          <Controller
            name="fromAccountId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                id="fromAccount"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency}) - Balance:{' '}
                    {parseFloat(account.balance).toFixed(2)}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.fromAccountId && (
            <p className="mt-1 text-sm text-red-600">
              {errors.fromAccountId.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="toAccount"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            To Account
          </label>
          <Controller
            name="toAccountId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                id="toAccount"
                disabled={!fromAccountId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select account</option>
                {differentCurrencyAccounts
                  .filter(
                    (a) =>
                      a.id !== fromAccountId &&
                      a.currency !== fromAccount?.currency,
                  )
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.currency})
                    </option>
                  ))}
              </select>
            )}
          />
          {errors.toAccountId && (
            <p className="mt-1 text-sm text-red-600">
              {errors.toAccountId.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Amount
          </label>
          <input
            {...register('amount')}
            type="number"
            id="amount"
            min="0.01"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
          )}
          {fromAccount && (
            <p className="mt-1 text-sm text-gray-500">
              Available: {parseFloat(fromAccount.balance).toFixed(2)}{' '}
              {fromAccount.currency}
            </p>
          )}
        </div>

        {exchangePreview && fromAccount && toAccount && (
          <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-md">
            <div className="mb-3 pb-3 border-b border-blue-200">
              <p className="text-base font-semibold text-blue-900 mb-1">
                Exchange Rate Information
              </p>
              <p className="text-sm text-blue-800">
                <strong>Rate:</strong> 1 {fromAccount.currency} ={' '}
                <span className="font-mono font-semibold">
                  {parseFloat(exchangePreview.rate).toFixed(4)}
                </span>{' '}
                {toAccount.currency}
              </p>
            </div>
            <div className="bg-white p-3 rounded border border-blue-200">
              <p className="text-sm text-gray-700 mb-1">
                <strong>You are exchanging:</strong>{' '}
                <span className="font-mono">
                  {parseFloat(amount || '0').toFixed(2)} {fromAccount.currency}
                </span>
              </p>
              <p className="text-base font-semibold text-blue-900">
                <strong>You will receive:</strong>{' '}
                <span className="font-mono text-lg">
                  {parseFloat(exchangePreview.result).toFixed(2)}{' '}
                  {toAccount.currency}
                </span>
              </p>
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description (optional)
          </label>
          <input
            {...register('description')}
            type="text"
            id="description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Exchange description"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Processing...' : 'Exchange'}
        </button>
      </form>
    </div>
  );
}
