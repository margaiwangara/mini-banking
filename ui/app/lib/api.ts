const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = {
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string | null,
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  },

  // Auth endpoints
  login(email: string, password: string) {
    return this.request<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register(email: string, password: string, name: string) {
    return this.request<{ access_token: string; user: any }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      },
    );
  },

  getMe(token: string) {
    return this.request<{ id: string; email: string; name: string }>(
      '/auth/me',
      {},
      token,
    );
  },

  // Account endpoints
  getAccounts(token: string) {
    return this.request<any[]>('/accounts', {}, token);
  },

  createAccount(token: string, data: { name: string; currency: string }) {
    return this.request<any>('/accounts', { method: 'POST', body: JSON.stringify(data) }, token);
  },

  // Transaction endpoints
  getTransactions(token: string, limit = 50, offset = 0, type?: string) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (type) {
      params.append('type', type);
    }
    return this.request<any[]>(
      `/transactions?${params.toString()}`,
      {},
      token,
    );
  },

  getRecentTransactions(token: string) {
    return this.request<any[]>('/transactions/recent', {}, token);
  },

  transfer(token: string, data: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    description?: string;
  }) {
    return this.request<any>(
      '/transactions/transfer',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    );
  },

  // Exchange endpoints
  getExchangeRate(from: string, to: string) {
    return this.request<{
      fromCurrency: string;
      toCurrency: string;
      rate: string;
      exampleAmount: string;
      exampleResult: string;
    }>(`/exchange/rate?from=${from}&to=${to}`);
  },

  calculateExchange(amount: number, from: string, to: string) {
    return this.request<{ amount: string; result: string; rate: string }>(
      `/exchange/calculate?amount=${amount}&from=${from}&to=${to}`,
    );
  },

  exchange(token: string, data: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    description?: string;
  }) {
    return this.request<any>(
      '/exchange',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    );
  },
};
