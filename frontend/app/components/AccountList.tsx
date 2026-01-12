'use client';

import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface Account {
  id: string;
  userId: string;
  currency: string;
  name: string;
  accountNumber: string;
  balance: string;
  createdAt: string;
  updatedAt: string;
}

interface AccountListProps {
  accounts: Account[];
  onRefresh: () => void;
}

export default function AccountList({
  accounts,
  onRefresh,
}: AccountListProps) {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    toast.success('Accounts refreshed');
    onRefresh();
  };

  if (accounts.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">
          No accounts yet. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Your Accounts</h2>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>
      <div className="divide-y divide-gray-200">
        {accounts.map((account) => (
          <div key={account.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {account.name}
                </h3>
                <div className="mt-1 space-y-1">
                  <p className="text-sm text-gray-500">
                    Account: {account.accountNumber || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {account.currency} • Created:{' '}
                    {new Date(account.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-gray-900">
                  {parseFloat(account.balance).toFixed(2)} {account.currency}
                </p>
                <p className="text-xs text-gray-500">Balance</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
