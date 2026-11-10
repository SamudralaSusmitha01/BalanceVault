import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { HashChainVisualizer } from '../components/HashChainVisualizer.jsx';
import { ProofModal } from '../components/ProofModal.jsx';
import {
  FileCheck2,
  ShieldCheck,
  AlertOctagon,
  RefreshCw,
  Bug,
  Wrench,
  Download,
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react';

export function LedgerProofPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [proofReport, setProofReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tamperMessage, setTamperMessage] = useState('');
  const [isTampered, setIsTampered] = useState(false);

  const loadLedger = async () => {
    setLoading(true);
    try {
      const res = await api.getLedgerEntries(100, 0);
      setEntries(res.entries || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const handleVerify = async () => {
    setVerifying(true);
    setTamperMessage('');
    try {
      const report = await api.verifyLedger();
      setProofReport(report);
      setShowModal(true);
      setIsTampered(!report.isValid);
    } catch (err) {
      alert(`Verification error: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleSimulateTamper = async () => {
    try {
      const res = await api.simulateTamper(0, 999999.0);
      setTamperMessage(`Tamper Simulated: Entry #1 altered to $999,999.00 without updating cryptographic hash.`);
      setIsTampered(true);
      await loadLedger();
      // Auto run verification to prove it catches it
      const report = await api.verifyLedger();
      setProofReport(report);
      setShowModal(true);
    } catch (err) {
      alert(`Tamper simulation error: ${err.message}`);
    }
  };

  const handleRepairTamper = async () => {
    try {
      const res = await api.repairTamper();
      setTamperMessage(res.message);
      setIsTampered(false);
      await loadLedger();
      const report = await api.verifyLedger();
      setProofReport(report);
      setShowModal(true);
    } catch (err) {
      alert(`Repair error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Verification Bar */}
      <div className="bg-[#0f172a] p-6 rounded-3xl border border-gray-800 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-2xl border ${
              isTampered
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
            }`}>
              {isTampered ? <AlertOctagon className="w-7 h-7" /> : <FileCheck2 className="w-7 h-7" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
                <span>Provable Ledger & Cryptographic Chain</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                  isTampered ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {isTampered ? 'INTEGRITY_BREACH' : 'CHAIN_INTACT'}
                </span>
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                Monotonically sequenced SHA-256 blocks with double-entry mathematical zero-sum verification
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadLedger}
              className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleVerify}
              disabled={verifying}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{verifying ? 'Recalculating SHA-256 Hashes...' : 'Run Cryptographic Proof'}</span>
            </button>
          </div>
        </div>

        {/* Evaluator Interactive Tamper Tools */}
        <div className="mt-6 pt-5 border-t border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-gray-400">
            <span className="font-semibold text-gray-200">Evaluator Proof Tools:</span>
            <span>Test tamper detection in real-time</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSimulateTamper}
              className="px-3.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-xl font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Simulate Row Alteration</span>
            </button>

            <button
              onClick={handleRepairTamper}
              className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-xl font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Repair & Re-Seal</span>
            </button>
          </div>
        </div>
      </div>

      {tamperMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-mono flex items-center space-x-2 ${
          isTampered
            ? 'bg-rose-950/40 border-rose-800 text-rose-300'
            : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
        }`}>
          {isTampered ? <AlertOctagon className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{tamperMessage}</span>
        </div>
      )}

      {/* Visual Hash Chain Timeline */}
      <div className="bg-[#0f172a] p-6 rounded-3xl border border-gray-800 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Live Ledger Chain Sequence</span>
            </h3>
            <p className="text-xs text-gray-400">Inspect sequence numbers, hashes, balances, and chaining</p>
          </div>
          <span className="text-xs font-mono text-gray-500">{entries.length} block(s) total</span>
        </div>

        <HashChainVisualizer entries={entries} />
      </div>

      {/* Certificate Modal */}
      {showModal && proofReport && (
        <ProofModal report={proofReport} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
