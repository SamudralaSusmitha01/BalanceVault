import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import {
  Vault,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  RefreshCw,
  Hash
} from 'lucide-react';

export function UserDashboard({ onNavigateTransfer, onNavigateLedger }) {
  const { user, refreshUser } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // KYC Form state
  const [legalName, setLegalName] = useState(user?.fullName || '');
  const [dob, setDob] = useState('1995-06-15');
  const [idType, setIdType] = useState('PASSPORT');
  const [idNumber, setIdNumber] = useState('P77889900');
  const [initialDeposit, setInitialDeposit] = useState('1500');
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycMessage, setKycMessage] = useState('');

  // Quick Deposit modal state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('500');
  const [depositing, setDepositing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [accRes, txnRes, kycRes] = await Promise.all([
        api.getAccounts().catch(() => []),
        api.getTransfers().catch(() => []),
        api.getKycStatus().catch(() => null)
      ]);
      setAccounts(accRes || []);
      setTransactions(txnRes || []);
      setKycStatus(kycRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    setKycSubmitting(true);
    setKycMessage('');
    try {
      const res = await api.submitKyc({
        legalName,
        dateOfBirth: dob,
        idType,
        idNumber,
        initialDepositRequested: parseFloat(initialDeposit) || 0
      });
      setKycMessage('KYC submitted! Awaiting administrator approval.');
      await loadData();
      await refreshUser();
    } catch (err) {
      setKycMessage(`Error: ${err.message}`);
    } finally {
      setKycSubmitting(false);
    }
  };

  const handleSyntheticDeposit = async (e) => {
    e.preventDefault();
    const primaryAccount = accounts[0];
    if (!primaryAccount) return;

    setDepositing(true);
    try {
      await api.deposit(primaryAccount.id, parseFloat(depositAmount));
      setShowDepositModal(false);
      await loadData();
      await refreshUser();
    } catch (err) {
      alert(`Deposit failed: ${err.message}`);
    } finally {
      setDepositing(false);
    }
  };

  const primaryAccount = accounts.find(a => a.accountType === 'CHECKING') || accounts[0];
  const isApproved = user?.status === 'ACTIVE' && primaryAccount;
  const isPendingKyc = kycStatus?.application?.status === 'PENDING';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-gray-900 to-[#0f172a] p-6 rounded-3xl border border-gray-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Welcome back, {user?.fullName}</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Account Status: <span className="font-semibold text-emerald-400 uppercase">{user?.status}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {isApproved && (
            <>
              <button
                onClick={() => setShowDepositModal(true)}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Synthetic Deposit</span>
              </button>

              <button
                onClick={onNavigateTransfer}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Move Money</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* KYC Onboarding Required Banner if not yet active */}
      {!isApproved && (
        <div className="bg-gradient-to-br from-amber-950/30 to-gray-900 border border-amber-900/50 rounded-3xl p-6 shadow-xl">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-2xl shrink-0">
              {isPendingKyc ? <Clock className="w-6 h-6 animate-pulse" /> : <FileText className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">
                {isPendingKyc ? 'Identity Verification In Review' : 'Account Onboarding & KYC Required'}
              </h3>
              <p className="text-xs text-gray-300 mt-1">
                {isPendingKyc
                  ? 'Your KYC onboarding documents have been securely received. An Administrator or Compliance Officer is reviewing your profile to activate your vault checking account.'
                  : 'To comply with financial ledger regulations, please complete the onboarding form below to provision your verified checking account and initial test funds.'}
              </p>

              {kycMessage && (
                <div className="mt-3 p-2.5 bg-gray-900/80 border border-amber-500/40 rounded-xl text-xs text-amber-300">
                  {kycMessage}
                </div>
              )}

              {!isPendingKyc && (
                <form onSubmit={handleKycSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Legal Full Name</label>
                    <input
                      type="text"
                      required
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3.5 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Government ID Type</label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className="w-full px-3.5 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="PASSPORT">Passport</option>
                      <option value="NATIONAL_ID">National ID Card</option>
                      <option value="DRIVERS_LICENSE">Driver's License</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Government ID Number</label>
                    <input
                      type="text"
                      required
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      className="w-full px-3.5 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Initial Synthetic Deposit ($USD)</label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={initialDeposit}
                      onChange={(e) => setInitialDeposit(e.target.value)}
                      placeholder="e.g. 1500"
                      className="w-full px-3.5 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <span className="text-[10px] text-gray-500 mt-1 block">Funds are created from the audited System Reserve upon administrator approval.</span>
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={kycSubmitting}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
                    >
                      {kycSubmitting ? 'Submitting Application...' : 'Submit Onboarding KYC Application'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Account Balances Card Grid */}
      {isApproved && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {accounts.map(acc => (
            <div
              key={acc.id}
              className="bg-[#0f172a] border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {acc.accountType} VAULT
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {acc.status}
                </span>
              </div>

              <div className="text-3xl font-extrabold text-white tracking-tight font-mono mb-1">
                ${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-gray-500 font-mono mb-6">Currency: {acc.currency}</div>

              <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400 font-mono">
                <span>Account Number:</span>
                <span className="text-gray-200 font-semibold">{acc.accountNumber}</span>
              </div>
            </div>
          ))}

          {/* Ledger Proof Quick Widget */}
          <div className="bg-[#0f172a] border border-gray-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-emerald-400 mb-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-bold text-sm">Provable Ledger Protected</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Every dollar moved through your account is immutably sealed in a SHA-256 Merkle chain. No balance can be altered without breaking mathematical consensus.
              </p>
            </div>

            <button
              onClick={onNavigateLedger}
              className="mt-4 w-full py-2 bg-gray-900 hover:bg-gray-800 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Verify Cryptographic Proof</span>
            </button>
          </div>
        </div>
      )}

      {/* Transaction History Section */}
      {isApproved && (
        <div className="bg-[#0f172a] border border-gray-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Audited Money Movement</h3>
              <p className="text-xs text-gray-400">Cryptographically verifiable transactions on your account</p>
            </div>
            <span className="text-xs font-mono text-gray-500">{transactions.length} record(s)</span>
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs">
              No transactions yet. Click "Move Money" to execute your first transfer!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 font-mono">
                    <th className="pb-3 font-semibold">Reference</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Memo</th>
                    <th className="pb-3 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-mono">
                  {transactions.map(txn => {
                    const isIncoming = accounts.some(a => a.id === txn.destinationAccountId);
                    return (
                      <tr key={txn.id} className="hover:bg-gray-900/40 transition-colors">
                        <td className="py-3 text-emerald-400 font-medium">{txn.reference}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isIncoming ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {isIncoming ? 'CREDIT' : 'DEBIT'}
                          </span>
                        </td>
                        <td className={`py-3 font-bold ${isIncoming ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isIncoming ? '+' : '-'}${Number(txn.amount).toFixed(2)}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-[10px]">
                            {txn.status}
                          </span>
                        </td>
                        <td className="py-3 text-gray-400 max-w-xs truncate">{txn.memo || 'Standard Transfer'}</td>
                        <td className="py-3 text-gray-500">{new Date(txn.createdAt).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Synthetic Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-gray-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Synthetic Test Funding</h3>
            <p className="text-xs text-gray-400 mb-4">
              Credits your account directly from the audited SYSTEM_VAULT reserve with double-entry ledger guarantee.
            </p>

            <form onSubmit={handleSyntheticDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Deposit Amount ($USD)</label>
                <input
                  type="number"
                  min="10"
                  step="10"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={depositing}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20"
                >
                  {depositing ? 'Crediting...' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
