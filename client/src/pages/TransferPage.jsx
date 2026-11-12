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
  RefreshCw,
  ExternalLink,
  Info,
  DollarSign
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

  const generateNewIdempotencyKey = () => {
    setIdempotencyKey(`idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const myAccs = await api.getAccounts();
        setAccounts(myAccs || []);
        if (myAccs && myAccs.length > 0) {
          setSourceAccountId(myAccs[0].id);
        }

        const allAccs = await api.getAccounts().catch(() => []);
        setAllSystemAccounts(allAccs || []);
      } catch (err) {
        setError(err.message);
      }
    };
    load();
    generateNewIdempotencyKey();
  }, []);

  const selectedSource = accounts.find(a => a.id === sourceAccountId);
  const selectedDest = allSystemAccounts.find(a => a.id === destAccountId);
  const parsedAmount = parseFloat(amount) || 0;

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError('');
    setReceipt(null);
    setLoading(true);

    try {
      const res = await api.transfer({
        sourceAccountId,
        destinationAccountId: destAccountId,
        amount: parsedAmount,
        memo
      }, idempotencyKey);

      setReceipt(res);
      // Refresh source accounts
      const updatedAccs = await api.getAccounts();
      setAccounts(updatedAccs);
      generateNewIdempotencyKey();
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0f172a] p-6 sm:p-7 rounded-3xl border border-gray-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-2xl">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                Audited Money Movement
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Execute Atomic Transfer
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Dual-entry conservation verified across source and destination balances
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transfer Form Column */}
        <div className="lg:col-span-2 bg-[#0f172a] p-6 sm:p-7 rounded-3xl border border-gray-800 shadow-xl">
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center space-x-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Source Account</label>
              <select
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
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
                className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="">-- Choose verified recipient account --</option>
                {allSystemAccounts
                  .filter(a => a.id !== sourceAccountId)
                  .map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} ({acc.user?.fullName || acc.accountType})
                    </option>
                  ))}
              </select>
              <span className="text-[10px] text-gray-500 mt-1 block">
                Transfers to frozen accounts or invalid recipients are rejected by backend constraints.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Transfer Amount ($USD)</label>
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
                  className="w-full pl-8 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm sm:text-base text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Fast Presets */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {[50, 100, 250, 500].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val.toString())}
                    className="px-2.5 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-800 text-xs font-mono transition-colors"
                  >
                    +${val}
                  </button>
                ))}
                {selectedSource && (
                  <button
                    type="button"
                    onClick={() => setAmount(selectedSource.balance.toString())}
                    className="px-2.5 py-1 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 rounded-lg border border-emerald-900/40 text-xs font-mono transition-colors ml-auto"
                  >
                    Max (${Number(selectedSource.balance).toFixed(2)})
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Transfer Memo / Reference</label>
              <input
                type="text"
                placeholder="e.g. Q4 Vendor services invoice payment"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Idempotency Key Box */}
            <div className="p-3.5 bg-gray-900/70 border border-gray-800 rounded-2xl flex items-center justify-between text-xs font-mono">
              <div className="overflow-hidden mr-2">
                <span className="text-gray-500 block text-[10px]">Idempotency Key (Network Replay Guard):</span>
                <span className="text-gray-300 truncate block text-[11px]">{idempotencyKey}</span>
              </div>
              <button
                type="button"
                onClick={generateNewIdempotencyKey}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors shrink-0"
                title="Generate New Idempotency Key"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedSource || parsedAmount <= 0}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-4"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Executing Atomic Ledger Transaction...' : 'Transfer Funds Now'}</span>
            </button>
          </form>
        </div>

        {/* Double-Entry Invariant Simulator Sidebar */}
        <div className="bg-[#0f172a] p-6 sm:p-7 rounded-3xl border border-gray-800 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-bold text-sm text-white">Mathematical Invariant Preview</h3>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Every transfer generates exactly two balanced entries. The net delta must equal zero.
            </p>

            {/* Live simulator cards */}
            <div className="space-y-2.5 font-mono text-xs">
              {/* Leg 1 */}
              <div className="p-3 bg-gray-900/90 border border-gray-800 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-[10px] text-rose-400 font-bold">
                  <span>LEG 1: DEBIT</span>
                  <span>SOURCE ACC</span>
                </div>
                <div className="text-gray-200 text-xs">
                  {selectedSource ? selectedSource.accountNumber : 'Not Selected'}
                </div>
                <div className="text-rose-400 font-bold text-sm">
                  -${parsedAmount.toFixed(2)} USD
                </div>
                {selectedSource && (
                  <div className="text-[10px] text-gray-500 pt-1 border-t border-gray-800">
                    Est. New Balance: ${(Number(selectedSource.balance) - parsedAmount).toFixed(2)} USD
                  </div>
                )}
              </div>

              {/* Leg 2 */}
              <div className="p-3 bg-gray-900/90 border border-gray-800 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-[10px] text-emerald-400 font-bold">
                  <span>LEG 2: CREDIT</span>
                  <span>DESTINATION ACC</span>
                </div>
                <div className="text-gray-200 text-xs">
                  {selectedDest ? selectedDest.accountNumber : 'Not Selected'}
                </div>
                <div className="text-emerald-400 font-bold text-sm">
                  +${parsedAmount.toFixed(2)} USD
                </div>
                {selectedDest && (
                  <div className="text-[10px] text-gray-500 pt-1 border-t border-gray-800">
                    Est. New Balance: ${(Number(selectedDest.balance) + parsedAmount).toFixed(2)} USD
                  </div>
                )}
              </div>

              {/* Invariant equation */}
              <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-emerald-300 text-[11px] space-y-1">
                <div className="font-bold flex items-center justify-between">
                  <span>System Conservation Delta:</span>
                  <span className="font-mono text-emerald-400">Δ = 0.00 USD</span>
                </div>
                <p className="text-[10px] text-gray-400">
                  Debits and credits sum to zero. Money is conserved and cannot be forged.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-800 text-[11px] text-gray-500 flex items-center space-x-1.5">
            <Info className="w-4 h-4 text-gray-400 shrink-0" />
            <span>Database transactions roll back atomically on any constraint violation.</span>
          </div>
        </div>
      </div>

      {/* Cryptographic Transaction Receipt Card upon completion */}
      {receipt && (
        <div className="bg-gradient-to-br from-emerald-950/30 via-[#0f172a] to-gray-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl animate-fade-in font-mono space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800/80 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Cryptographic Transaction Receipt</h3>
                <p className="text-xs text-emerald-400">Sealed Reference: {receipt.transaction?.reference}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={copyReceipt}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Receipt' : 'Copy JSON'}</span>
              </button>
              <button
                onClick={onNavigateLedger}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
              >
                <span>Inspect in Ledger Proof</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-black/50 rounded-xl border border-gray-800">
              <span className="text-gray-500 block mb-0.5">Transaction ID:</span>
              <span className="text-white font-bold">{receipt.transaction?.id}</span>
            </div>

            <div className="p-3 bg-black/50 rounded-xl border border-gray-800">
              <span className="text-gray-500 block mb-0.5">Amount Settled:</span>
              <span className="text-emerald-400 font-bold">${Number(receipt.transaction?.amount).toFixed(2)} USD</span>
            </div>

            <div className="p-3 bg-black/50 rounded-xl border border-gray-800">
              <span className="text-gray-500 block mb-0.5">Leg 1 (Debit Block):</span>
              <span className="text-gray-300">
                Seq #{receipt.ledgerEntries?.[0]?.sequenceNumber} — Hash: {receipt.ledgerEntries?.[0]?.currentHash?.substring(0, 20)}...
              </span>
            </div>

            <div className="p-3 bg-black/50 rounded-xl border border-gray-800">
              <span className="text-gray-500 block mb-0.5">Leg 2 (Credit Block):</span>
              <span className="text-gray-300">
                Seq #{receipt.ledgerEntries?.[1]?.sequenceNumber} — Hash: {receipt.ledgerEntries?.[1]?.currentHash?.substring(0, 20)}...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
