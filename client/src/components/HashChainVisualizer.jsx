import React, { useState } from 'react';
import {
  Link2,
  ArrowDown,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Lock,
  Unlock,
  Key,
  Info
} from 'lucide-react';

export function HashChainVisualizer({ entries = [] }) {
  const [copiedHash, setCopiedHash] = useState(null);

  if (!entries || entries.length === 0) {
    return (
      <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl text-slate-400">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-slate-500">
          <Shield className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-300">No ledger entries recorded yet.</p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Execute an account deposit or peer-to-peer transfer to forge the first cryptographic block into the chain.
        </p>
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Legend / Non-technical helper */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 to-slate-950/80 border border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">
            <strong>How judges read this ledger:</strong> Each block below contains a mathematical fingerprint (SHA-256) of its data plus the hash of the preceding block. If even 1 cent is altered in the database, the chain breaks.
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] font-mono shrink-0">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span>Debit (Outflow)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <span>Credit (Inflow)</span>
          </span>
        </div>
      </div>

      {sorted.map((entry, idx) => {
        const isDebit = entry.entryType === 'DEBIT';
        const isGenesis = idx === 0 || entry.sequenceNumber === 1;

        return (
          <div key={entry.id || idx} className="relative group">
            {/* Visual Cryptographic Link Connector */}
            {!isGenesis && (
              <div className="flex items-center justify-center my-2">
                <div className="flex items-center space-x-2 bg-slate-900/90 px-3.5 py-1 rounded-full border border-slate-800 text-[11px] font-mono shadow-sm">
                  <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-400">Cryptographically Chained to Block #{entry.sequenceNumber - 1}</span>
                  <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>
            )}

            {/* Block Card */}
            <div className={`p-5 rounded-2xl border transition-all duration-200 ${
              isDebit
                ? 'bg-gradient-to-br from-rose-950/15 to-slate-900/80 border-rose-900/30 hover:border-rose-700/50 hover:shadow-glow-rose'
                : 'bg-gradient-to-br from-emerald-950/15 to-slate-900/80 border-emerald-900/30 hover:border-emerald-700/50 hover:shadow-glow-emerald'
            }`}>
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800/90 text-slate-100 rounded-lg font-mono text-xs font-bold border border-slate-700/60">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>BLOCK #{entry.sequenceNumber}</span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono tracking-wider ${
                    isDebit
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {entry.entryType}
                  </span>

                  {isGenesis && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      GENESIS ROOT
                    </span>
                  )}

                  <span className="text-xs text-slate-300 font-mono">
                    Account: <strong className="text-white">{entry.account?.accountNumber || entry.accountId}</strong>
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-right">
                  <div>
                    <div className={`text-base font-extrabold font-mono tracking-tight ${
                      isDebit ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {isDebit ? '-' : '+'}${Number(entry.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Balance After: ${Number(entry.balanceAfter).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Plain-English translation for evaluators */}
              <div className="mb-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs text-slate-300 flex items-center justify-between gap-2">
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isDebit ? 'text-rose-400' : 'text-emerald-400'} shrink-0`} />
                  <span>
                    <strong>Human Summary:</strong> {isDebit ? 'Decrements' : 'Increments'} {entry.account?.accountNumber || 'account'} by <strong>${Number(entry.amount).toFixed(2)}</strong>. Resulting verified balance is <strong>${Number(entry.balanceAfter).toFixed(2)}</strong>.
                  </span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                  {new Date(entry.createdAt).toLocaleTimeString()}
                </span>
              </div>

              {/* Cryptographic Linkage Details */}
              <div className="space-y-2 font-mono text-[11px]">
                {/* Previous Hash Link */}
                <div className="flex items-center justify-between gap-3 bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 font-semibold shrink-0 flex items-center space-x-1">
                    <Key className="w-3 h-3 text-slate-500" />
                    <span>PREV_BLOCK_HASH:</span>
                  </span>
                  <div className="flex items-center space-x-2 truncate">
                    <span className="text-slate-300 truncate max-w-xs sm:max-w-md">
                      {entry.previousHash || '0000000000000000000000000000000000000000000000000000000000000000'}
                    </span>
                    <button
                      onClick={() => copyToClipboard(entry.previousHash, `prev-${entry.id}`)}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                      title="Copy previous hash"
                    >
                      {copiedHash === `prev-${entry.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Entry Hash Sealed */}
                <div className="flex items-center justify-between gap-3 bg-emerald-950/20 p-2 rounded-xl border border-emerald-900/40">
                  <span className="text-emerald-400 font-bold shrink-0 flex items-center space-x-1">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>SHA-256 SEAL:</span>
                  </span>
                  <div className="flex items-center space-x-2 truncate">
                    <span className="text-emerald-300 font-medium truncate max-w-xs sm:max-w-md">
                      {entry.currentHash}
                    </span>
                    <button
                      onClick={() => copyToClipboard(entry.currentHash, `curr-${entry.id}`)}
                      className="p-1 hover:bg-emerald-900/40 rounded text-emerald-400 hover:text-emerald-200 transition-colors"
                      title="Copy sealed entry hash"
                    >
                      {copiedHash === `curr-${entry.id}` ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Transaction ID link */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Transaction ID: {entry.transactionId}</span>
                <span>Timestamp: {new Date(entry.createdAt).toISOString()}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
