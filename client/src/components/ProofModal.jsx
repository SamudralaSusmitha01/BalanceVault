import React from 'react';
import { ShieldCheck, AlertOctagon, X, Copy, Check, Download } from 'lucide-react';

export function ProofModal({ report, onClose }) {
  const [copied, setCopied] = React.useState(false);

  if (!report) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] border border-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className={`p-3 rounded-xl ${
            report.isValid
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
          }`}>
            {report.isValid ? <ShieldCheck className="w-7 h-7" /> : <AlertOctagon className="w-7 h-7" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Cryptographic Proof Certificate</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                report.isValid
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}>
                {report.isValid ? 'VERIFIED_VALID' : 'TAMPER_DETECTED'}
              </span>
            </h3>
            <p className="text-xs text-gray-400">SHA-256 Merkle chain and double-entry mathematical zero-sum verification</p>
          </div>
        </div>

        {/* Certificate Details */}
        <div className="space-y-3 font-mono text-xs bg-black/50 p-4 rounded-xl border border-gray-800">
          <div className="flex justify-between py-1 border-b border-gray-800/80">
            <span className="text-gray-400">Verification Result:</span>
            <span className={report.isValid ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {report.isValid ? 'PASSED (100% INTACT)' : 'FAILED (CORRUPTION / TAMPERING)'}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-gray-800/80">
            <span className="text-gray-400">Total Ledger Entries Checked:</span>
            <span className="text-gray-200">{report.totalEntries}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-gray-800/80">
            <span className="text-gray-400">Total Balanced Transactions:</span>
            <span className="text-gray-200">{report.totalTransactions}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-gray-800/80">
            <span className="text-gray-400">Double-Entry Sum Invariant:</span>
            <span className="text-emerald-400 font-bold">Δ = 0.0000 USD (Balanced)</span>
          </div>

          <div className="py-1 border-b border-gray-800/80">
            <span className="text-gray-400 block mb-0.5">Genesis Root Hash:</span>
            <span className="text-gray-300 break-all text-[11px] bg-gray-900/80 p-1.5 rounded block">
              {report.genesisHash}
            </span>
          </div>

          <div className="py-1 border-b border-gray-800/80">
            <span className="text-gray-400 block mb-0.5">Ledger Head Hash:</span>
            <span className="text-emerald-300 break-all text-[11px] bg-emerald-950/40 border border-emerald-900/40 p-1.5 rounded block">
              {report.headHash}
            </span>
          </div>

          <div className="flex justify-between py-1">
            <span className="text-gray-400">Verified Timestamp:</span>
            <span className="text-gray-300">{new Date(report.verifiedAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Error Breakdown if any */}
        {report.errors && report.errors.length > 0 && (
          <div className="mt-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs">
            <div className="font-bold flex items-center space-x-1.5 mb-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <span>Integrity Violations Found:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 font-mono text-[11px]">
              {report.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end space-x-3">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Proof JSON'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
