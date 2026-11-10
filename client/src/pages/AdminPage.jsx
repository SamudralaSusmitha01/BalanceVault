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
  Sparkles
} from 'lucide-react';

export function AdminPage() {
  const [stats, setStats] = useState(null);
  const [kycApps, setKycApps] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState('');

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0f172a] p-6 rounded-3xl border border-gray-800 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <UserCheck className="w-6 h-6 text-red-400" />
            <span>Administrative Command & Control</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Server-enforced user onboarding review, account control, and system ledger oversight
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs flex items-center space-x-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-medium">
          {message}
        </div>
      )}

      {/* KPI Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0f172a] p-5 rounded-2xl border border-gray-800">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Total Users
            </span>
            <div className="text-2xl font-bold text-white font-mono">{stats.userCount}</div>
          </div>

          <div className="bg-[#0f172a] p-5 rounded-2xl border border-gray-800">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Active Accounts
            </span>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{stats.accountCount}</div>
          </div>

          <div className="bg-[#0f172a] p-5 rounded-2xl border border-gray-800">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Ledger Blocks
            </span>
            <div className="text-2xl font-bold text-teal-400 font-mono">{stats.ledgerEntryCount}</div>
          </div>

          <div className="bg-[#0f172a] p-5 rounded-2xl border border-gray-800">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Pending KYC
            </span>
            <div className="text-2xl font-bold text-amber-400 font-mono">{stats.pendingKycCount}</div>
          </div>
        </div>
      )}

      {/* KYC Review Queue */}
      <div className="bg-[#0f172a] border border-gray-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">KYC Onboarding Queue</h3>
            <p className="text-xs text-gray-400">Approve or reject customer registration applications</p>
          </div>
          <span className="text-xs font-mono text-amber-400 font-semibold">
            {kycApps.filter(k => k.status === 'PENDING').length} Pending Review
          </span>
        </div>

        {kycApps.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs font-mono">
            No KYC applications submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="pb-3">Applicant Name</th>
                  <th className="pb-3">ID Type & Number</th>
                  <th className="pb-3">DOB</th>
                  <th className="pb-3">Requested Deposit</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {kycApps.map(app => (
                  <tr key={app.id} className="hover:bg-gray-900/40 transition-colors">
                    <td className="py-3 font-semibold text-gray-200">
                      {app.legalName}
                      <span className="block text-[10px] text-gray-500 font-normal">{app.user?.email}</span>
                    </td>
                    <td className="py-3 text-gray-300">
                      {app.idType}: {app.idNumber}
                    </td>
                    <td className="py-3 text-gray-400">{app.dateOfBirth}</td>
                    <td className="py-3 font-bold text-emerald-400">
                      ${Number(app.initialDepositRequested).toFixed(2)} USD
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        app.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 text-right space-x-2">
                      {app.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleReviewKyc(app.id, 'APPROVE')}
                            disabled={actionLoading === app.id}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewKyc(app.id, 'REJECT')}
                            disabled={actionLoading === app.id}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Account Control & Freeze Management */}
      <div className="bg-[#0f172a] border border-gray-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">System Accounts & Status Management</h3>
            <p className="text-xs text-gray-400">Freeze or unfreeze customer accounts to halt unauthorized transfers</p>
          </div>
          <span className="text-xs font-mono text-gray-500">{accounts.length} total account(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="pb-3">Account Number</th>
                <th className="pb-3">Account Holder</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Balance</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Enforcement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {accounts.map(acc => {
                const isFrozen = acc.status === 'FROZEN';
                const isVault = acc.accountType === 'SYSTEM_VAULT';

                return (
                  <tr key={acc.id} className="hover:bg-gray-900/40 transition-colors">
                    <td className="py-3 font-bold text-emerald-400">{acc.accountNumber}</td>
                    <td className="py-3 text-gray-200">
                      {acc.user?.fullName || 'System Reserve'}
                      <span className="block text-[10px] text-gray-500 font-normal">{acc.user?.email || 'vault@internal'}</span>
                    </td>
                    <td className="py-3 text-gray-400">{acc.accountType}</td>
                    <td className="py-3 font-bold text-white">
                      ${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isFrozen
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {acc.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {!isVault && (
                        <button
                          onClick={() => handleToggleFreeze(acc.id, acc.status)}
                          disabled={actionLoading === acc.id}
                          className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center space-x-1 ml-auto ${
                            isFrozen
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60'
                          }`}
                        >
                          {isFrozen ? <Sun className="w-3 h-3" /> : <Snowflake className="w-3 h-3" />}
                          <span>{isFrozen ? 'Unfreeze' : 'Freeze'}</span>
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
