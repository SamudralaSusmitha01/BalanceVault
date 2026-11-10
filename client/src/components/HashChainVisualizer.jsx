import React from 'react';
import { Link2, ArrowDown, Shield, CheckCircle, AlertTriangle } from 'lucide-react';

export function HashChainVisualizer({ entries = [] }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-900/50 border border-gray-800 rounded-xl text-gray-400">
        <Shield className="w-10 h-10 text-gray-600 mx-auto mb-2" />
        <p className="text-sm font-medium">No ledger entries recorded yet.</p>
        <p className="text-xs text-gray-500 mt-1">Execute a transaction to initiate the cryptographic hash chain.</p>
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  return (
    <div className="space-y-3 font-mono text-xs">
      {sorted.map((entry, idx) => {
        const isDebit = entry.entryType === 'DEBIT';
        const isGenesis = idx === 0;

        return (
          <div key={entry.id || idx} className="relative">
            {/* Connector arrow from previous block */}
            {!isGenesis && (
              <div className="flex items-center justify-center my-1 text-emerald-500/60">
                <div className="flex items-center space-x-1.5 bg-gray-900/80 px-2.5 py-0.5 rounded border border-gray-800 text-[10px]">
                  <Link2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-gray-400">chained via SHA-256</span>
                  <ArrowDown className="w-3 h-3 text-emerald-400" />
                </div>
              </div>
            )}

            {/* Block Card */}
            <div className={`p-4 rounded-xl border transition-all ${
              isDebit
                ? 'bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60'
                : 'bg-emerald-950/20 border-emerald-900/40 hover:border-emerald-700/60'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-2.5 mb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-gray-800 text-gray-200 rounded font-semibold text-xs">
                    BLOCK #{entry.sequenceNumber}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    isDebit
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {entry.entryType}
                  </span>
                  <span className="text-gray-400 text-[11px]">
                    Account: <span className="text-gray-200 font-medium">{entry.account?.accountNumber || entry.accountId}</span>
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className={`font-bold text-sm ${isDebit ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isDebit ? '-' : '+'}${Number(entry.amount).toFixed(2)}
                    </span>
                    <span className="text-gray-500 text-[10px] block">
                      Bal After: ${Number(entry.balanceAfter).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cryptographic Linkages */}
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-start justify-between gap-2 bg-black/40 p-1.5 rounded">
                  <span className="text-gray-500 shrink-0">PREV_HASH:</span>
                  <span className="text-gray-400 truncate max-w-[280px] sm:max-w-md font-mono">
                    {entry.previousHash || 'GENESIS_ROOT'}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2 bg-emerald-950/40 p-1.5 rounded border border-emerald-800/30">
                  <span className="text-emerald-400 font-semibold shrink-0">ENTRY_HASH:</span>
                  <span className="text-emerald-300 truncate max-w-[280px] sm:max-w-md font-mono font-medium">
                    {entry.currentHash}
                  </span>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500">
                <span>Txn ID: {entry.transactionId}</span>
                <span>{new Date(entry.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
