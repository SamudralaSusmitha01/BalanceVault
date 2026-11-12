import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import {
  ScrollText,
  RefreshCw,
  Filter,
  Shield,
  CheckCircle,
  AlertTriangle,
  Search,
  Check,
  Copy,
  X,
  FileCode,
  ShieldCheck,
  Info
} from 'lucide-react';

export function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterAction) params.action = filterAction;
      const res = await api.getAuditLogs(params);
      setLogs(res.logs || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filterAction]);

  const copyLogJson = (log) => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const actorMatch = (log.actorEmail || log.actorId || '').toLowerCase().includes(term);
    const actionMatch = (log.action || '').toLowerCase().includes(term);
    const resMatch = (log.resourceType || '').toLowerCase().includes(term);
    const ipMatch = (log.ipAddress || '').toLowerCase().includes(term);
    return actorMatch || actionMatch || resMatch || ipMatch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-teal-950/20 via-[#0f172a] to-gray-900 p-6 sm:p-7 rounded-3xl border border-teal-900/30 shadow-xl">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded-2xl shrink-0">
            <ScrollText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono tracking-wider font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 uppercase">
                Regulatory Compliance Audit Trail
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                AUDITOR / READ-ONLY
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Immutable Security Event Trail
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Chronological, append-only security logs for authentication, KYC decisions, transfers, and ledger proofs
            </p>
          </div>
        </div>

        <button
          onClick={loadLogs}
          className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs flex items-center space-x-1.5 transition-colors border border-gray-700/60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0f172a] p-4 sm:p-5 rounded-2xl border border-gray-800 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3.5 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
          >
            <option value="">All Audit Actions</option>
            <option value="ADMIN_BOOTSTRAP_SUCCESSFUL">ADMIN_BOOTSTRAP</option>
            <option value="USER_REGISTERED">USER_REGISTERED</option>
            <option value="LOGIN_SUCCESSFUL">LOGIN_SUCCESSFUL</option>
            <option value="KYC_APPLICATION_SUBMITTED">KYC_SUBMITTED</option>
            <option value="KYC_APPLICATION_APPROVED">KYC_APPROVED</option>
            <option value="KYC_APPLICATION_REJECTED">KYC_REJECTED</option>
            <option value="MONEY_TRANSFER_COMPLETED">TRANSFER_COMPLETED</option>
            <option value="ACCOUNT_FROZEN">ACCOUNT_FROZEN</option>
            <option value="ACCOUNT_UNFROZEN">ACCOUNT_UNFROZEN</option>
            <option value="LEDGER_VERIFICATION_PASSED">LEDGER_VERIFIED</option>
          </select>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search actor, IP, or resource..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 font-mono w-56 sm:w-64"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#0f172a] border border-gray-800 rounded-3xl p-6 sm:p-7 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 font-mono">
            {filteredLogs.length} Log Records Retrieved
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-gray-800 rounded-2xl">
            <ScrollText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <div className="text-sm font-semibold text-gray-300">No Audit Events Found</div>
            <p className="text-xs text-gray-500 mt-1">
              No records match your selected action filter or search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="pb-3 font-semibold">Timestamp</th>
                  <th className="pb-3 font-semibold">Actor / Identity</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Action</th>
                  <th className="pb-3 font-semibold">Resource</th>
                  <th className="pb-3 font-semibold">Outcome</th>
                  <th className="pb-3 font-semibold text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filteredLogs.map(log => {
                  const isSuccess = log.status === 'SUCCESS';
                  return (
                    <tr key={log.id} className="hover:bg-gray-900/40 transition-colors">
                      <td className="py-3.5 text-gray-400 whitespace-nowrap text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3.5 font-semibold text-gray-200">
                        {log.actorEmail || log.actorId || 'SYSTEM_INTERNAL'}
                        {log.ipAddress && (
                          <span className="block text-[10px] text-gray-500 font-normal">{log.ipAddress}</span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 bg-gray-900 border border-gray-800 text-gray-300 rounded text-[10px]">
                          {log.actorRole || 'SYSTEM'}
                        </span>
                      </td>
                      <td className="py-3.5 font-bold text-teal-300">{log.action}</td>
                      <td className="py-3.5 text-gray-400">{log.resourceType || 'SYSTEM'}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isSuccess
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 bg-gray-900 hover:bg-gray-800 text-teal-400 hover:text-teal-300 rounded-lg border border-gray-800 text-[11px] font-sans font-semibold transition-colors"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f172a] border border-gray-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded-xl">
                <ScrollText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Audit Event Inspection</h3>
                <p className="text-xs text-gray-400 font-mono">ID: {selectedLog.id}</p>
              </div>
            </div>

            <div className="bg-black/60 p-4 rounded-2xl border border-gray-800 text-xs font-mono text-gray-300 space-y-2.5 max-h-96 overflow-y-auto">
              <div className="flex justify-between border-b border-gray-800/80 pb-1.5">
                <span className="text-gray-400">Action:</span>
                <span className="text-teal-300 font-bold">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800/80 pb-1.5">
                <span className="text-gray-400">Actor:</span>
                <span className="text-white">{selectedLog.actorEmail || selectedLog.actorId}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800/80 pb-1.5">
                <span className="text-gray-400">Role:</span>
                <span className="text-gray-200">{selectedLog.actorRole || 'SYSTEM'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800/80 pb-1.5">
                <span className="text-gray-400">IP Address:</span>
                <span className="text-gray-200">{selectedLog.ipAddress || '127.0.0.1'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800/80 pb-1.5">
                <span className="text-gray-400">Resource:</span>
                <span className="text-gray-200">{selectedLog.resourceType} ({selectedLog.resourceId || 'N/A'})</span>
              </div>
              <div className="flex justify-between border-b border-gray-800/80 pb-1.5">
                <span className="text-gray-400">ISO Timestamp:</span>
                <span className="text-gray-200">{new Date(selectedLog.timestamp).toISOString()}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">Payload Metadata:</span>
                <pre className="p-3 bg-gray-900/90 rounded-xl text-emerald-300 text-[11px] overflow-x-auto border border-gray-800 select-all">
                  {selectedLog.details || 'No extended payload attributes'}
                </pre>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end space-x-3">
              <button
                onClick={() => copyLogJson(selectedLog)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-semibold transition-colors"
              >
                {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPayload ? 'Copied' : 'Copy JSON'}</span>
              </button>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
