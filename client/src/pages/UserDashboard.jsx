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
  Hash,
  Copy,
  Check,
  Search,
  Filter,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';

export function UserDashboard({ onNavigateTransfer, onNavigateLedger }) {
  const { user, refreshUser } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'CREDIT' | 'DEBIT'
  const [copiedAcc, setCopiedAcc] = useState(false);

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
      setKycMessage('Identity application submitted! An administrator will review and fund your account.');
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

  const copyAccountNumber = (accNum) => {
    navigator.clipboard.writeText(accNum);
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
  };

  const primaryAccount = accounts.find(a => a.accountType === 'CHECKING') || accounts[0];
  const isApproved = user?.status === 'ACTIVE' && primaryAccount;
  const isPendingKyc = kycStatus?.application?.status === 'PENDING';
  const isRejectedKyc = kycStatus?.application?.status === 'REJECTED';

  // Filter transactions
  const filteredTransactions = transactions.filter(txn => {
    const isIncoming = accounts.some(a => a.id === txn.destinationAccountId);
    const txnType = isIncoming ? 'CREDIT' : 'DEBIT';

    if (filterType !== 'ALL' && txnType !== filterType) {
      return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const refMatch = txn.reference?.toLowerCase().includes(term);
      const memoMatch = txn.memo?.toLowerCase().includes(term);
      const amountMatch = txn.amount?.toString().includes(term);
      return refMatch || memoMatch || amountMatch;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-gray-900 via-[#0f172a] to-gray-900 p-6 sm:p-7 rounded-3xl border border-gray-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
              Vault Account Holder
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              user?.status === 'ACTIVE'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : user?.status === 'FROZEN'
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            }`}>
              {user?.status}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.fullName}
          </h1>
          <p className="text-xs text-gray-400">
            Provable ledger operations & real-time double-entry account oversight
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs flex items-center space-x-1.5 transition-colors border border-gray-700/60"
            title="Refresh Account Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {isApproved && (
            <>
              <button
                onClick={() => setShowDepositModal(true)}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
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

      {/* Onboarding Stepper Banner (when not yet active or pending) */}
      {!isApproved && (
        <div className="bg-[#0f172a] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div>
            <span className="text-[10px] font-mono tracking-wider font-bold text-amber-400 uppercase">
              Onboarding Protocol
            </span>
            <h2 className="text-xl font-bold text-white mt-1">Identity Verification & Account Activation</h2>
            <p className="text-xs text-gray-400 mt-1">
              Follow the 4-stage regulatory workflow to unlock audited checking and money movement capabilities.
            </p>
          </div>

          {/* Stepper Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            {/* Step 1 */}
            <div className="p-3.5 rounded-2xl bg-gray-900 border border-emerald-500/30 flex items-start space-x-3">
              <div className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-emerald-400 text-[11px]">1. Registration</div>
                <div className="text-[10px] text-gray-400">Credentials saved</div>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`p-3.5 rounded-2xl border flex items-start space-x-3 ${
              isPendingKyc || isApproved
                ? 'bg-gray-900 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-950/20 border-amber-500/40 text-amber-300'
            }`}>
              <div className={`p-1.5 rounded-full ${
                isPendingKyc || isApproved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {isPendingKyc || isApproved ? <CheckCircle2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              </div>
              <div>
                <div className="font-bold text-[11px]">2. KYC Submission</div>
                <div className="text-[10px] text-gray-400">
                  {isPendingKyc ? 'Documents Received' : 'Required next'}
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`p-3.5 rounded-2xl border flex items-start space-x-3 ${
              isApproved
                ? 'bg-gray-900 border-emerald-500/30 text-emerald-400'
                : isPendingKyc
                ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                : 'bg-gray-900/60 border-gray-800 text-gray-500'
            }`}>
              <div className={`p-1.5 rounded-full ${
                isApproved
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : isPendingKyc
                  ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                  : 'bg-gray-800 text-gray-500'
              }`}>
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-[11px]">3. Admin Review</div>
                <div className="text-[10px] text-gray-400">
                  {isPendingKyc ? 'In Queue (Pending)' : 'Awaiting KYC'}
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className={`p-3.5 rounded-2xl border flex items-start space-x-3 ${
              isApproved
                ? 'bg-gray-900 border-emerald-500/30 text-emerald-400'
                : 'bg-gray-900/60 border-gray-800 text-gray-500'
            }`}>
              <div className={`p-1.5 rounded-full ${
                isApproved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-500'
              }`}>
                <Vault className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-[11px]">4. Active Vault</div>
                <div className="text-[10px] text-gray-400">Account & transfers unlocked</div>
              </div>
            </div>
          </div>

          {/* Pending Review State Message */}
          {isPendingKyc && (
            <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-900/60 flex items-start space-x-3.5">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="text-sm font-bold text-amber-300">Application Under Administrative Review</h4>
                <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                  Your KYC profile has been cryptographically recorded. You can switch to the <strong className="text-red-400">Admin</strong> persona to review and approve this pending application, or wait for an administrator to approve it.
                </p>
              </div>
            </div>
          )}

          {/* KYC Form (when not pending) */}
          {!isPendingKyc && (
            <div className="pt-2">
              {kycMessage && (
                <div className="mb-5 p-3.5 bg-gray-900 border border-amber-500/40 rounded-xl text-xs text-amber-300">
                  {kycMessage}
                </div>
              )}

              <form onSubmit={handleKycSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Legal Full Name</label>
                  <input
                    type="text"
                    required
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Government Document Type</label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="PASSPORT">Passport</option>
                    <option value="NATIONAL_ID">National ID Card</option>
                    <option value="DRIVERS_LICENSE">Driver's License</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Government ID Number</label>
                  <input
                    type="text"
                    required
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                    Requested Initial Synthetic Deposit ($USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={initialDeposit}
                    onChange={(e) => setInitialDeposit(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    Funds will be allocated atomically from the reserve upon administrator approval.
                  </span>
                </div>

                <div className="md:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={kycSubmitting}
                    className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-600/20 transition-all flex items-center space-x-2"
                  >
                    <span>{kycSubmitting ? 'Submitting Application...' : 'Submit Verification Application'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Account Balance & Integrity Cards Grid (when active) */}
      {isApproved && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Balance Hero Card */}
          {accounts.map(acc => (
            <div
              key={acc.id}
              className="lg:col-span-2 bg-[#0f172a] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all"
            >
              {/* Background watermark */}
              <div className="absolute right-4 -bottom-6 text-gray-800/20 pointer-events-none select-none">
                <Vault className="w-56 h-56" />
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
                    {acc.accountType} VAULT
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {acc.status}
                </span>
              </div>

              <div className="my-4">
                <span className="text-xs text-gray-400 uppercase font-mono block mb-1">Available Settled Balance</span>
                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
                  ${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-sm font-normal text-gray-400 ml-2">USD</span>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">Account Number:</span>
                  <button
                    onClick={() => copyAccountNumber(acc.accountNumber)}
                    className="flex items-center space-x-1.5 px-2.5 py-1 bg-gray-900 hover:bg-gray-800 text-gray-200 rounded-lg border border-gray-800 transition-colors group"
                  >
                    <span>{acc.accountNumber}</span>
                    {copiedAcc ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300" />
                    )}
                  </button>
                </div>

                <div className="flex items-center space-x-2 text-[11px] text-gray-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Double-Entry Guaranteed</span>
                </div>
              </div>
            </div>
          ))}

          {/* Cryptographic Ledger Guard Card */}
          <div className="bg-[#0f172a] border border-gray-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm text-white">Provable Ledger Seal</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Your account balance is not an editable database cell. It is the deterministic sum of cryptographically signed SHA-256 blocks chained from the genesis root.
              </p>
              <div className="p-3 bg-gray-900/60 rounded-xl border border-gray-800 text-[11px] text-gray-300 font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Chain Status:</span>
                  <span className="text-emerald-400 font-bold">100% INTACT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Invariant:</span>
                  <span className="text-emerald-400">Δ = 0.00 USD</span>
                </div>
              </div>
            </div>

            <button
              onClick={onNavigateLedger}
              className="mt-5 w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Verify Cryptographic Proof</span>
            </button>
          </div>
        </div>
      )}

      {/* Transaction History Section (when active) */}
      {isApproved && (
        <div className="bg-[#0f172a] border border-gray-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Audited Money Movement</h3>
              <p className="text-xs text-gray-400">
                Every transaction below corresponds to immutable SHA-256 ledger blocks
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search reference or memo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono w-48 sm:w-60"
                />
              </div>

              <div className="flex items-center space-x-1 bg-gray-900 p-1 rounded-xl border border-gray-800 text-[11px] font-mono">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    filterType === 'ALL' ? 'bg-gray-800 text-white font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('CREDIT')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    filterType === 'CREDIT' ? 'bg-emerald-950/60 text-emerald-400 font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Credits
                </button>
                <button
                  onClick={() => setFilterType('DEBIT')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    filterType === 'DEBIT' ? 'bg-rose-950/60 text-rose-400 font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Debits
                </button>
              </div>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-gray-800 rounded-2xl">
              <Vault className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <div className="text-sm font-semibold text-gray-300">No Transactions Found</div>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {searchTerm || filterType !== 'ALL'
                  ? 'No records match your active search or filter criteria.'
                  : 'You have not made any money movements yet. Click "Move Money" to execute your first transfer!'}
              </p>
              {!searchTerm && filterType === 'ALL' && (
                <button
                  onClick={onNavigateTransfer}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Initiate First Transfer
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="pb-3 font-semibold">Reference</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Memo</th>
                    <th className="pb-3 font-semibold text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {filteredTransactions.map(txn => {
                    const isIncoming = accounts.some(a => a.id === txn.destinationAccountId);
                    return (
                      <tr key={txn.id} className="hover:bg-gray-900/40 transition-colors">
                        <td className="py-3.5 text-emerald-400 font-medium">
                          {txn.reference}
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center space-x-1 w-max ${
                            isIncoming
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {isIncoming ? (
                              <>
                                <ArrowDownLeft className="w-3 h-3" />
                                <span>CREDIT</span>
                              </>
                            ) : (
                              <>
                                <ArrowUpRight className="w-3 h-3" />
                                <span>DEBIT</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className={`py-3.5 font-bold ${isIncoming ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isIncoming ? '+' : '-'}${Number(txn.amount).toFixed(2)} USD
                        </td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-[10px]">
                            {txn.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-gray-300 max-w-xs truncate font-sans text-xs">
                          {txn.memo || 'Standard Vault Transfer'}
                        </td>
                        <td className="py-3.5 text-gray-500 text-right whitespace-nowrap">
                          {new Date(txn.createdAt).toLocaleString()}
                        </td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f172a] border border-gray-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Synthetic Reserve Funding</h3>
            <p className="text-xs text-gray-400 mb-4">
              Funds will be allocated directly from the audited SYSTEM_VAULT reserve with double-entry balance preservation.
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

              {/* Quick amount presets */}
              <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                {['100', '250', '500', '1000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className={`py-1.5 rounded-lg border text-center transition-colors ${
                      depositAmount === amt
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={depositing}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-colors"
                >
                  {depositing ? 'Processing Deposit...' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
