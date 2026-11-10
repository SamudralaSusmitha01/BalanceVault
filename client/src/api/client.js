const BASE_URL = '';

export async function apiRequest(endpoint, { method = 'GET', body = null, headers = {} } = {}) {
  const token = localStorage.getItem('bv_token');
  const reqHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers: reqHeaders
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || data.error || `HTTP error ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth & Bootstrap
  getBootstrapStatus: () => apiRequest('/api/auth/bootstrap-status'),
  bootstrapAdmin: (payload) => apiRequest('/api/auth/bootstrap-admin', { method: 'POST', body: payload }),
  login: (email, password) => apiRequest('/api/auth/login', { method: 'POST', body: { email, password } }),
  register: (payload) => apiRequest('/api/auth/register', { method: 'POST', body: payload }),
  getMe: () => apiRequest('/api/auth/me'),

  // Accounts & Transfers
  getAccounts: () => apiRequest('/api/accounts'),
  getAccount: (id) => apiRequest(`/api/accounts/${id}`),
  deposit: (accountId, amount) => apiRequest('/api/accounts/deposit', { method: 'POST', body: { accountId, amount } }),
  updateAccountStatus: (id, status) => apiRequest(`/api/accounts/${id}/status`, { method: 'PATCH', body: { status } }),
  transfer: (payload, idempotencyKey) => apiRequest('/api/transfers', {
    method: 'POST',
    body: payload,
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}
  }),
  getTransfers: () => apiRequest('/api/transfers'),
  getTransfer: (id) => apiRequest(`/api/transfers/${id}`),

  // KYC
  submitKyc: (payload) => apiRequest('/api/kyc/submit', { method: 'POST', body: payload }),
  getKycStatus: () => apiRequest('/api/kyc/status'),
  getKycApplications: (status) => apiRequest(`/api/kyc/applications${status ? `?status=${status}` : ''}`),
  reviewKyc: (id, decision, notes) => apiRequest(`/api/kyc/${id}/review`, { method: 'POST', body: { decision, notes } }),

  // Ledger & Cryptographic Proof
  getLedgerEntries: (limit = 100, offset = 0) => apiRequest(`/api/ledger/entries?limit=${limit}&offset=${offset}`),
  verifyLedger: () => apiRequest('/api/ledger/verify', { method: 'POST' }),
  simulateTamper: (entryIndex, tamperedAmount) => apiRequest('/api/ledger/simulate-tamper', { method: 'POST', body: { entryIndex, tamperedAmount } }),
  repairTamper: () => apiRequest('/api/ledger/repair', { method: 'POST' }),

  // Audit Logs & System
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/audit/logs${query ? `?${query}` : ''}`);
  },
  getSystemStats: () => apiRequest('/api/system/stats'),
  seedDemo: () => apiRequest('/api/system/seed-demo', { method: 'POST' }),
  getHealth: () => apiRequest('/health'),
  getReady: () => apiRequest('/ready')
};
