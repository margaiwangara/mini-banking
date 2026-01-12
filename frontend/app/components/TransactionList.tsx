'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTransactions } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';

const SYSTEM_EQUITY_ACCOUNT_ID = '00000000-0000-0000-0000-000000000001';

interface LedgerEntry {
  id: string;
  accountId: string;
  amount: string;
  description: string;
  createdAt: string;
  account?: {
    id: string;
    name: string;
    accountNumber: string;
    currency: string;
  };
}

interface Transaction {
  id: string;
  userId: string;
  type: string;
  description: string;
  ledgerEntries: LedgerEntry[];
  createdAt: string;
}

interface Account {
  id: string;
  accountNumber: string;
  name: string;
  currency: string;
}

const TRANSACTION_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'EXCHANGE', label: 'Exchange' },
  { value: 'DEPOSIT', label: 'Deposit' },
  { value: 'WITHDRAWAL', label: 'Withdrawal' },
];

const ITEMS_PER_PAGE = 10;

interface TransactionItemProps {
  transaction: Transaction;
  accounts: Account[];
}

function TransactionItem({ transaction, accounts }: TransactionItemProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const userEntries = transaction.ledgerEntries.filter(
    (entry) => entry.accountId !== SYSTEM_EQUITY_ACCOUNT_ID,
  );
  const systemEntries = transaction.ledgerEntries.filter(
    (entry) => entry.accountId === SYSTEM_EQUITY_ACCOUNT_ID,
  );

  // Helper to get account info (prefer from entry.account, fallback to accounts list)
  const getAccountInfo = (entry: LedgerEntry) => {
    if (entry.account) {
      return {
        accountNumber: entry.account.accountNumber || 'N/A',
        name: entry.account.name,
        currency: entry.account.currency,
      };
    }
    const account = accounts.find((a) => a.id === entry.accountId);
    return (
      account || { accountNumber: 'N/A', name: 'Unknown Account', currency: '' }
    );
  };

  // Determine transaction flow for transfers and exchanges
  const getTransactionFlow = () => {
    if (
      (transaction.type === 'TRANSFER' || transaction.type === 'EXCHANGE') &&
      userEntries.length === 2
    ) {
      const fromEntry = userEntries.find((e) => parseFloat(e.amount) < 0);
      const toEntry = userEntries.find((e) => parseFloat(e.amount) > 0);
      if (fromEntry && toEntry) {
        const fromAccount = getAccountInfo(fromEntry);
        const toAccount = getAccountInfo(toEntry);
        const fromAmount = Math.abs(parseFloat(fromEntry.amount));
        const toAmount = parseFloat(toEntry.amount);
        return {
          fromAccount,
          toAccount,
          fromAmount,
          toAmount,
          isExchange: transaction.type === 'EXCHANGE',
        };
      }
    }
    return null;
  };

  const flow = getTransactionFlow();

  return (
    <div className="px-6 py-4 hover:bg-gray-50">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {transaction.description}
          </h3>
          <div className="mt-1 space-y-1">
            <p className="text-sm text-gray-500">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {transaction.type}
              </span>
              {' • '}
              <span className="text-gray-400">
                ID: {transaction.id.slice(0, 8)}...
              </span>
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          {new Date(transaction.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Visual flow for transfers and exchanges */}
      {flow && (
        <div className="mb-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between gap-4">
            {/* From Account - Far Left */}
            <div className="flex-shrink-0 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-600 uppercase">
                  From
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {flow.fromAccount.accountNumber}
                </span>
              </div>
              <div className="text-xs text-gray-600 truncate">
                {flow.fromAccount.name} • {flow.fromAccount.currency}
              </div>
            </div>

            {/* Amounts - Centered */}
            <div className="flex-1 flex items-center justify-center gap-3 px-4">
              <div className="text-center">
                <div className="text-sm font-bold text-red-600">
                  -{flow.fromAmount.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600">
                  {flow.fromAccount.currency}
                </div>
              </div>
              <svg
                className="w-6 h-6 text-blue-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              <div className="text-center">
                <div className="text-sm font-bold text-green-600">
                  +{flow.toAmount.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600">
                  {flow.toAccount.currency}
                </div>
              </div>
            </div>

            {/* To Account - Far Right */}
            <div className="flex-shrink-0 min-w-0 text-right">
              <div className="flex items-center justify-end gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-600 uppercase">
                  To
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {flow.toAccount.accountNumber}
                </span>
              </div>
              <div className="text-xs text-gray-600 truncate">
                {flow.toAccount.name} • {flow.toAccount.currency}
              </div>
            </div>
          </div>
          {flow.isExchange && (
            <div className="mt-2 pt-2 border-t border-blue-200">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                Currency Exchange
              </span>
            </div>
          )}
        </div>
      )}

      {/* Regular entries display (for non-transfer/exchange transactions or when flow is not available) */}
      {!flow && (
        <div className="mt-3 space-y-2">
          {userEntries.map((entry) => {
            const account = getAccountInfo(entry);
            const amount = parseFloat(entry.amount);
            const isPositive = amount > 0;

            return (
              <div
                key={entry.id}
                className="text-sm p-3 border border-gray-200 rounded-lg bg-white"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                        isPositive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {isPositive ? 'Credit' : 'Debit'}
                    </span>
                    <div>
                      <div className="font-medium text-gray-900">
                        {account.accountNumber}
                      </div>
                      <div className="text-xs text-gray-500">
                        {account.name} • {account.currency}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-base font-semibold ${
                        isPositive ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {amount.toFixed(2)} {account.currency}
                    </div>
                    {entry.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {entry.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {systemEntries.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            {showTechnicalDetails
              ? 'Hide Technical Details'
              : 'Show Technical Details (Double-Entry Accounting)'}
          </button>
          {showTechnicalDetails && (
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-xs font-semibold text-gray-700 mb-2">
                System Equity Entries (for accounting balance):
              </p>
              <div className="space-y-1">
                {systemEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="text-xs p-2 rounded bg-gray-100 text-gray-600"
                  >
                    <span className="font-medium">
                      {parseFloat(entry.amount) > 0 ? '+' : ''}
                      {parseFloat(entry.amount).toFixed(2)}
                    </span>
                    {' - '}
                    <span>{entry.description}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2 italic">
                These entries maintain double-entry accounting integrity. The
                sum of all entries equals zero.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TransactionList() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const queryClient = useQueryClient();

  const offset = (page - 1) * ITEMS_PER_PAGE;
  const {
    data: transactions = [],
    isLoading,
    refetch,
  } = useTransactions(ITEMS_PER_PAGE, offset, typeFilter || undefined);
  const { data: accounts = [] } = useAccounts();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    toast.success('Transactions refreshed');
    refetch();
  };

  const handleTypeChange = (newType: string) => {
    setTypeFilter(newType);
    setPage(1); // Reset to first page when filter changes
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (transactions.length === ITEMS_PER_PAGE) {
      setPage(page + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Transaction History
          </h2>
          <div className="flex gap-4 items-center">
            <select
              value={typeFilter}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {TRANSACTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-500">No transactions found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Transaction History
        </h2>
        <div className="flex gap-4 items-center">
          <select
            value={typeFilter}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {TRANSACTION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            accounts={accounts}
          />
        ))}
      </div>
      <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
        <button
          onClick={handlePreviousPage}
          disabled={page === 1}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-sm text-gray-700">Page {page}</span>
        <button
          onClick={handleNextPage}
          disabled={transactions.length < ITEMS_PER_PAGE}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
