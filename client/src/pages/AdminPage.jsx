import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import {
  UserCheck,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Snowflake,
  Sun,
  Users,
  CreditCard,
  Layers,
  RefreshCw,
  Sparkles,
  Search,
  CheckCircle2,
  AlertOctagon,
  Clock,
  ShieldCheck,
  FileText
} from 'lucide-react';

export function AdminPage() {
  const [stats, setStats] = useState(null);
  const [kycApps, setKycApps] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState('');
  const [kycFilter, setKycFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [accountSearch, setAccountSearch] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, kycRes, accRes] = await Promise.all([
        api.getSystemStats().catch(() => null),
        api.getKycApplications().catch(() => []),
        api.getAccounts().catch(() => [])
      ]);
      setStats(statsRes);
      setKycApps(kycRes || []);
      setAccounts(accRes || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleReviewKyc = async (appId, decision) => {
    setActionLoading(appId);
    setMessage('');
    try {
      await api.reviewKyc(appId, decision, `Administrative review: ${decision}ed via dashboard`);
      setMessage(`Application successfully ${decision.toLowerCase()}d.`);
      await loadAdminData();
    } catch (err) {
      setMessage(`Review error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFreeze = async (accountId, currentStatus) => {
    setActionLoading(accountId);
    setMessage('');
    const newStatus = currentStatus === 'FROZEN' ? 'ACTIVE' : 'FROZEN';
    try {
      await api.updateAccountStatus(accountId, newStatus);
      setMessage(`Account status updated to ${newStatus}`);
      await loadAdminData();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter KYC applications
  const filteredKycApps = kycApps.filter(app => {
    if (kycFilter === 'ALL') return true;
    return app.status === kycFilter;
  });

  // Filter accounts
  const filteredAccounts = accounts.filter(acc => {
    if (!accountSearch) return true;
    const term = accountSearch.toLowerCase();
    const accNumMatch = acc.accountNumber?.toLowerCase().includes(term);
    const holderMatch = acc.user?.fullName?.toLowerCase().includes(term);
    const emailMatch = acc.user?.email?.toLowerCase().includes(term);
    return accNumMatch || holderMatch || emailMatch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-red-950/20 via-[#0f172a] to-gray-900 p-6 sm:p-7 rounded-3xl border border-red-900/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono tracking-wider font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 uppercase">
              Root Authority Mode
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
              ROLE: ADMIN
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <span>Root Command & Administrative Control</span>
          </h1>
          <p className="text-xs text-gray-400">
            KYC onboarding approval, account enforcement, and system reserve monitoring
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs flex items-center space-x-1.5 transition-colors border border-gray-700/60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {message && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-medium flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0f172a] p-5 rounded-2xl border border-gray-800 shadow-lg">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Users</span>
              <Users className="w-4 h-4 text-gray-500" />
            </div>
            <div className="text-3xl font-bold text-white font-mono">{stats.userCount}</div>
            <span className="text-[10px] text-gray-500 mt-1 block">Registered profiles</span>
          </div>

          <div className="bg-[#0f172a] p-5 rounded-2xl border border-gray-800 shadow-lg">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Active Accounts</span>
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-emerald-400 font-mono">{stats.accountCount}</div>
            <span className="text-[10px] text-gray-500 mt-1 block">Funded vault checking</span>
          </div>

          <div className="bg-[#0f172a] p-5 rounded-2xl border border-gray-800 shadow-lg">
            <div className="flex items-center justify-between text-teal-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Ledger Blocks</span>
              <Layers className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-3xl font-bold text-teal-400 font-mono">{stats.ledgerEntryCount}</div>
            <span className="text-[10px] text-gray-500 mt-1 block">Cryptographic chained records</span>
          </div>

          <div className="bg-[#0f172a] p-5 rounded-2xl border border-gray-800 shadow-lg">
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Pending Review</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-amber-400 font-mono">{stats.pendingKycCount}</div>
            <span className="text-[10px] text-gray-500 mt-1 block">Awaiting KYC decision</span>
          </div>
        </div>
      )}

      {/* KYC Review Queue */}
      <div className="bg-[#0f172a] border border-gray-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-bold text-white tracking-tight">KYC Onboarding Approval Queue</h3>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Review and approve applicant identities to allocate accounts and test funds
            </p>
          </div>

          {/* Filter pills */}
          <div className="flex items-center space-x-1 bg-gray-900 p-1 rounded-xl border border-gray-800 text-[11px] font-mono">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
              <button
                key={f}
                onClick={() => setKycFilter(f)}
                className={`px-3 py-1 rounded-lg transition-colors capitalize ${
                  kycFilter === f ? 'bg-gray-800 text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                {f.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {filteredKycApps.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-gray-800 rounded-2xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/60 mx-auto mb-3" />
            <div className="text-sm font-semibold text-gray-300">Queue is Clear</div>
            <p className="text-xs text-gray-500 mt-1">
              No KYC applications matching the selected filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="pb-3 font-semibold">Applicant Legal Name</th>
                  <th className="pb-3 font-semibold">Document Details</th>
                  <th className="pb-3 font-semibold">DOB</th>
                  <th className="pb-3 font-semibold">Requested Deposit</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filteredKycApps.map(app => (
                  <tr key={app.id} className="hover:bg-gray-900/40 transition-colors">
                    <td className="py-3.5 font-semibold text-gray-200">
                      {app.legalName}
                      <span className="block text-[11px] text-gray-500 font-normal font-sans">{app.user?.email}</span>
                    </td>
                    <td className="py-3.5 text-gray-300">
                      <span className="px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 text-[10px]">
                        {app.idType}
                      </span>
                      <span className="ml-1.5 text-gray-300 font-mono">{app.idNumber}</span>
                    </td>
                    <td className="py-3.5 text-gray-400">{app.dateOfBirth}</td>
                    <td className="py-3.5 font-bold text-emerald-400">
                      ${Number(app.initialDepositRequested).toFixed(2)} USD
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        app.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      {app.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleReviewKyc(app.id, 'APPROVE')}
                            disabled={actionLoading === app.id}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                          >
                            Approve & Fund
                          </button>
                          <button
                            onClick={() => handleReviewKyc(app.id, 'REJECT')}
                            disabled={actionLoading === app.id}
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-gray-500 italic">Review Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Account Control & Freeze Management Section */}
      <div className="bg-[#0f172a] border border-gray-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-bold text-white tracking-tight">System Accounts & Status Enforcement</h3>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Instantly freeze customer accounts to prevent fraudulent transfers or unfreeze upon audit review
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search account or user..."
              value={accountSearch}
              onChange={(e) => setAccountSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 font-mono w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="pb-3 font-semibold">Account Number</th>
                <th className="pb-3 font-semibold">Account Holder</th>
                <th className="pb-3 font-semibold">Vault Type</th>
                <th className="pb-3 font-semibold">Settled Balance</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Enforcement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredAccounts.map(acc => {
                const isFrozen = acc.status === 'FROZEN';
                const isVault = acc.accountType === 'SYSTEM_VAULT';

                return (
                  <tr key={acc.id} className="hover:bg-gray-900/40 transition-colors">
                    <td className="py-3.5 font-bold text-emerald-400">{acc.accountNumber}</td>
                    <td className="py-3.5 text-gray-200">
                      {acc.user?.fullName || 'System Reserve'}
                      <span className="block text-[11px] text-gray-500 font-normal font-sans">
                        {acc.user?.email || 'internal@balancevault.system'}
                      </span>
                    </td>
                    <td className="py-3.5 text-gray-400">{acc.accountType}</td>
                    <td className="py-3.5 font-bold text-white">
                      ${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        isFrozen
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {acc.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      {!isVault && (
                        <button
                          onClick={() => handleToggleFreeze(acc.id, acc.status)}
                          disabled={actionLoading === acc.id}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors inline-flex items-center space-x-1.5 ${
                            isFrozen
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60'
                          }`}
                        >
                          {isFrozen ? <Sun className="w-3.5 h-3.5" /> : <Snowflake className="w-3.5 h-3.5" />}
                          <span>{isFrozen ? 'Unfreeze Account' : 'Freeze Account'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
