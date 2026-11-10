import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import {
  ArrowLeftRight,
  ShieldCheck,
  Send,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';

export function TransferPage({ onNavigateLedger }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [allSystemAccounts, setAllSystemAccounts] = useState([]);
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [destAccountId, setDestAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const myAccs = await api.getAccounts();
        setAccounts(myAccs || []);
        if (myAccs && myAccs.length > 0) {
          setSourceAccountId(myAccs[0].id);
        }

        // Fetch other accounts to populate recipient picker
        const allAccs = await api.getAccounts().catch(() => []);
        setAllSystemAccounts(allAccs || []);
      } catch (err) {
        setError(err.message);
      }
    };
    load();
    // Auto-generate fresh idempotency key
    setIdempotencyKey(`idemp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
  }, []);

  const selectedSource = accounts.find(a => a.id === sourceAccountId);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError('');
    setReceipt(null);
    setLoading(true);

    try {
      const res = await api.transfer({
        sourceAccountId,
        destinationAccountId: destAccountId,
        amount: parseFloat(amount),
        memo
      }, idempotencyKey);

      setReceipt(res);
      // Refresh source account balance
      const updatedAccs = await api.getAccounts();
      setAccounts(updatedAccs);
    } catch (err) {
      setError(err.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const copyReceipt = () => {
    navigator.clipboard.writeText(JSON.stringify(receipt, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#0f172a] p-6 rounded-3xl border border-gray-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-2xl">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Initiate Audited Money Movement</h1>
            <p className="text-xs text-gray-400">Atomic double-entry transaction sealed into the SHA-256 ledger</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Transfer Form */}
        <div className="md:col-span-2 bg-[#0f172a] p-6 rounded-3xl border border-gray-800 shadow-xl">
          {error && (
            <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Source Account</label>
              <select
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountNumber} ({acc.accountType}) — Available: ${Number(acc.balance).toFixed(2)} USD
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Recipient Account</label>
              <select
                required
                value={destAccountId}
                onChange={(e) => setDestAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="">-- Select Recipient Account --</option>
                {allSystemAccounts
                  .filter(a => a.id !== sourceAccountId)
                  .map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} ({acc.user?.fullName || acc.accountType})
                    </option>
                  ))}
              </select>
              <span className="text-[10px] text-gray-500 mt-1 block">
                Must be an active verified account. Transfers to frozen accounts are rejected.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Amount ($USD)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-gray-500 font-mono text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Transfer Memo / Reference</label>
              <input
                type="text"
                placeholder="e.g. Q3 Vendor invoice payment"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl font-mono text-[11px]">
              <span className="text-gray-500 block mb-1">Idempotency Key (Network Retry Protection):</span>
              <span className="text-gray-300 truncate block">{idempotencyKey}</span>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedSource}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-4"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Executing Atomic Transfer...' : 'Execute Money Movement'}</span>
            </button>
          </form>
        </div>

        {/* Transaction Invariant Preview Sidebar */}
        <div className="bg-[#0f172a] p-6 rounded-3xl border border-gray-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Double-Entry Invariants</span>
            </h3>

            <div className="space-y-3 text-xs text-gray-400 leading-relaxed font-mono">
              <div className="p-3 bg-gray-900/70 border border-gray-800 rounded-xl">
                <div className="text-rose-400 font-semibold text-[11px] mb-1">LEG 1: DEBIT</div>
                <div>Source Account: -${amount ? Number(amount).toFixed(2) : '0.00'}</div>
                <div className="text-[10px] text-gray-500">Decrements sender's verified balance</div>
              </div>

              <div className="p-3 bg-gray-900/70 border border-gray-800 rounded-xl">
                <div className="text-emerald-400 font-semibold text-[11px] mb-1">LEG 2: CREDIT</div>
                <div>Dest Account: +${amount ? Number(amount).toFixed(2) : '0.00'}</div>
                <div className="text-[10px] text-gray-500">Increments recipient's verified balance</div>
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-emerald-300 text-[11px]">
                <div className="font-bold">Net System Delta: 0.0000 USD</div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Money cannot be created out of thin air. Both entries are cryptographically chained.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cryptographic Receipt Card upon completion */}
      {receipt && (
        <div className="bg-gradient-to-br from-emerald-950/30 to-[#0f172a] border border-emerald-900/60 rounded-3xl p-6 shadow-2xl animate-fade-in font-mono">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Cryptographic Transaction Receipt</h3>
                <p className="text-xs text-emerald-400">Transaction ID: {receipt.transaction?.id}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={copyReceipt}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={onNavigateLedger}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
              >
                Inspect Ledger Proof
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-black/40 rounded-xl border border-gray-800">
              <span className="text-gray-500 block mb-0.5">Reference Number:</span>
              <span className="text-white font-bold">{receipt.transaction?.reference}</span>
            </div>

            <div className="p-3 bg-black/40 rounded-xl border border-gray-800">
              <span className="text-gray-500 block mb-0.5">Amount Transferred:</span>
              <span className="text-emerald-400 font-bold">${Number(receipt.transaction?.amount).toFixed(2)} USD</span>
            </div>

            <div className="p-3 bg-black/40 rounded-xl border border-gray-800">
              <span className="text-gray-500 block mb-0.5">Debit Ledger Block:</span>
              <span className="text-gray-300">Seq #{receipt.ledgerEntries?.[0]?.sequenceNumber} (Hash: {receipt.ledgerEntries?.[0]?.currentHash?.substring(0, 16)}...)</span>
            </div>

            <div className="p-3 bg-black/40 rounded-xl border border-gray-800">
              <span className="text-gray-500 block mb-0.5">Credit Ledger Block:</span>
              <span className="text-gray-300">Seq #{receipt.ledgerEntries?.[1]?.sequenceNumber} (Hash: {receipt.ledgerEntries?.[1]?.currentHash?.substring(0, 16)}...)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
