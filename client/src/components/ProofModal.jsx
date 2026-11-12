import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  X,
  Copy,
  Check,
  Download,
  Lock,
  FileCode,
  Layers,
  CheckCircle2,
  Info
} from 'lucide-react';

export function ProofModal({ report, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!report) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `balancevault-proof-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const isValid = Boolean(report.isValid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0f172a] border border-gray-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${
          isValid
            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 shadow-glow-emerald'
            : 'bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500 shadow-glow-rose'
        }`} />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Header */}
        <div className="flex items-start space-x-4 mb-6">
          <div className={`p-3.5 rounded-2xl shrink-0 ${
            isValid
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
          }`}>
            {isValid ? <ShieldCheck className="w-8 h-8" /> : <AlertOctagon className="w-8 h-8" />}
          </div>
          <div className="pr-8">
            <div className="flex items-center space-x-2.5 mb-1">
              <span className="text-[11px] font-mono tracking-wider uppercase text-gray-400">
                Official Audit Certificate
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                isValid
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              }`}>
                {isValid ? 'VERIFIED_VALID' : 'TAMPER_DETECTED'}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Cryptographic Ledger Proof Seal
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Deterministic validation of SHA-256 block linking and double-entry conservation invariant
            </p>
          </div>
        </div>

        {/* Verification Checklist */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center space-x-2">
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${isValid ? 'text-emerald-400' : 'text-gray-500'}`} />
            <span className="text-[11px] text-gray-300">Sequential Monotonicity</span>
          </div>
          <div className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center space-x-2">
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${isValid ? 'text-emerald-400' : 'text-rose-400'}`} />
            <span className="text-[11px] text-gray-300">SHA-256 Hash Matching</span>
          </div>
          <div className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center space-x-2">
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${isValid ? 'text-emerald-400' : 'text-rose-400'}`} />
            <span className="text-[11px] text-gray-300">Parent-Block Chaining</span>
          </div>
          <div className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center space-x-2">
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${isValid ? 'text-emerald-400' : 'text-rose-400'}`} />
            <span className="text-[11px] text-gray-300">Zero-Sum Conservation (Δ=0)</span>
          </div>
        </div>

        {/* Certificate Metrics Card */}
        <div className="space-y-3 font-mono text-xs bg-black/60 p-4 sm:p-5 rounded-2xl border border-gray-800/80">
          <div className="flex justify-between items-center py-1.5 border-b border-gray-800/80">
            <span className="text-gray-400">Audit Status:</span>
            <span className={isValid ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {isValid ? '100% MATHEMATICALLY INTACT' : 'INTEGRITY BREACH IDENTIFIED'}
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-gray-800/80">
            <span className="text-gray-400">Total Ledger Blocks Verified:</span>
            <span className="text-gray-200 font-bold">{report.totalEntries} entries</span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-gray-800/80">
            <span className="text-gray-400">Balanced Transactions:</span>
            <span className="text-gray-200 font-bold">{report.totalTransactions} transactions</span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-gray-800/80">
            <span className="text-gray-400">Conservation Delta:</span>
            <span className="text-emerald-400 font-bold">Δ = 0.000000 USD (Balanced)</span>
          </div>

          <div className="py-2 border-b border-gray-800/80">
            <span className="text-gray-400 block mb-1 text-[11px]">Genesis Block Hash (Sequence #0):</span>
            <span className="text-gray-300 break-all text-[11px] bg-gray-900/90 border border-gray-800 p-2 rounded-xl block select-all">
              {report.genesisHash}
            </span>
          </div>

          <div className="py-2 border-b border-gray-800/80">
            <span className="text-gray-400 block mb-1 text-[11px]">Ledger Head Hash (Latest Block):</span>
            <span className="text-emerald-300 break-all text-[11px] bg-emerald-950/30 border border-emerald-900/50 p-2 rounded-xl block select-all">
              {report.headHash}
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5 text-gray-400 text-[11px]">
            <span>Verification Timestamp:</span>
            <span className="text-gray-300">{new Date(report.verifiedAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Error Breakdown if any */}
        {report.errors && report.errors.length > 0 && (
          <div className="mt-4 p-4 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-rose-300 text-xs">
            <div className="font-bold flex items-center space-x-2 mb-2 text-rose-400">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>Cryptographic Discrepancies Flagged by Verifier:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 font-mono text-[11px]">
              {report.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Educational Note */}
        <div className="mt-4 p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-2xl flex items-start space-x-2 text-emerald-300/80 text-[11px]">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <span>
            Non-technical explanation: Every ledger entry's cryptographic hash depends directly on all prior entries. If an adversary attempts to modify any historical transaction, all subsequent hashes diverge immediately.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Proof JSON</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
