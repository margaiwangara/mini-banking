'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import SideNav from './components/SideNav';
import AccountList from './components/AccountList';
import TransactionList from './components/TransactionList';
import CreateAccountForm from './components/CreateAccountForm';
import TransferForm from './components/TransferForm';
import ExchangeForm from './components/ExchangeForm';
import { useAccounts } from './hooks/useAccounts';
import { useRecentTransactions } from './hooks/useTransactions';
import toast from 'react-hot-toast';

export default function Home() {
  const [activeTab, setActiveTab] = useState<
    'accounts' | 'transactions' | 'transfer' | 'exchange'
  >('accounts');
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  const {
    data: accounts = [],
    isLoading: accountsLoading,
    refetch: refetchAccounts,
  } = useAccounts();
  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
  } = useRecentTransactions();

  const loading = accountsLoading || transactionsLoading;

  // Show welcome notification for initial balances
  useEffect(() => {
    if (
      !loading &&
      !hasShownWelcome &&
      accounts.length > 0 &&
      transactions.length === 0
    ) {
      const usdAccount = accounts.find((a) => a.currency === 'USD');
      const eurAccount = accounts.find((a) => a.currency === 'EUR');

      if (usdAccount && eurAccount) {
        const usdBalance = parseFloat(usdAccount.balance);
        const eurBalance = parseFloat(eurAccount.balance);

        // Check if accounts have initial balances (5000 each)
        if (usdBalance >= 5000 && eurBalance >= 5000) {
          toast.success(
            `Welcome! Your accounts have been initialized with 5,000.00 USD and 5,000.00 EUR`,
            { duration: 6000 },
          );
          setHasShownWelcome(true);
        }
      }
    }
  }, [accounts, transactions, loading, hasShownWelcome]);

  const handleAccountCreated = () => {
    refetchAccounts();
  };

  const handleTransfer = () => {
    refetchAccounts();
    refetchTransactions();
  };

  const handleExchange = () => {
    refetchAccounts();
    refetchTransactions();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex">
        <SideNav
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as typeof activeTab)}
        />

        <main className="flex-1 lg:ml-64">
          <div className="p-4 sm:p-6 lg:p-8">
            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            )}

            {!loading && activeTab === 'accounts' && (
              <div className="space-y-6">
                <CreateAccountForm onAccountCreated={handleAccountCreated} />
                <AccountList accounts={accounts} onRefresh={refetchAccounts} />
              </div>
            )}

            {activeTab === 'transactions' && <TransactionList />}

            {!loading && activeTab === 'transfer' && (
              <TransferForm onTransfer={handleTransfer} />
            )}

            {!loading && activeTab === 'exchange' && (
              <ExchangeForm onExchange={handleExchange} />
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
