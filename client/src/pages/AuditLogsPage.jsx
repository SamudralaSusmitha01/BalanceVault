import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { ScrollText, RefreshCw, Filter, Shield, CheckCircle, AlertTriangle } from 'lucide-react';

export function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0f172a] p-6 rounded-3xl border border-gray-800 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded-2xl">
            <ScrollText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Immutable Compliance Audit Trail</h1>
            <p className="text-xs text-gray-400">Chronological, tamper-evident record of all security and account events</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
          >
            <option value="">All Audit Actions</option>
            <option value="ADMIN_BOOTSTRAP_SUCCESSFUL">ADMIN_BOOTSTRAP</option>
            <option value="USER_REGISTERED">USER_REGISTERED</option>
            <option value="LOGIN_SUCCESSFUL">LOGIN_SUCCESSFUL</option>
            <option value="KYC_APPLICATION_SUBMITTED">KYC_SUBMITTED</option>
            <option value="KYC_APPLICATION_APPROVED">KYC_APPROVED</option>
            <option value="MONEY_TRANSFER_COMPLETED">TRANSFER_COMPLETED</option>
            <option value="ACCOUNT_FROZEN">ACCOUNT_FROZEN</option>
            <option value="LEDGER_VERIFICATION_PASSED">LEDGER_VERIFIED</option>
          </select>

          <button
            onClick={loadLogs}
            className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#0f172a] border border-gray-800 rounded-3xl p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Actor</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Action</th>
                <th className="pb-3">Resource</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {logs.map(log => {
                const isSuccess = log.status === 'SUCCESS';
                return (
                  <tr key={log.id} className="hover:bg-gray-900/40 transition-colors">
                    <td className="py-3 text-gray-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 font-semibold text-gray-200">
                      {log.actorEmail || log.actorId || 'SYSTEM'}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-[10px]">
                        {log.actorRole || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-teal-300">{log.action}</td>
                    <td className="py-3 text-gray-400">{log.resourceType}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        isSuccess ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-[11px] text-teal-400 hover:underline font-sans"
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
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-gray-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Audit Record Inspector</h3>
            <p className="text-xs text-gray-400 mb-4 font-mono">ID: {selectedLog.id}</p>

            <div className="bg-black/60 p-4 rounded-xl border border-gray-800 text-xs font-mono text-gray-300 space-y-2 overflow-x-auto max-h-96">
              <div><strong className="text-gray-400">Action:</strong> {selectedLog.action}</div>
              <div><strong className="text-gray-400">Actor:</strong> {selectedLog.actorEmail} ({selectedLog.actorId})</div>
              <div><strong className="text-gray-400">Role:</strong> {selectedLog.actorRole}</div>
              <div><strong className="text-gray-400">IP Address:</strong> {selectedLog.ipAddress || '127.0.0.1'}</div>
              <div><strong className="text-gray-400">Resource:</strong> {selectedLog.resourceType} ({selectedLog.resourceId})</div>
              <div><strong className="text-gray-400">Timestamp:</strong> {new Date(selectedLog.timestamp).toISOString()}</div>
              <div>
                <strong className="text-gray-400 block mb-1">Raw Payload Details:</strong>
                <pre className="p-2.5 bg-gray-900 rounded-lg text-emerald-300 text-[11px]">
                  {selectedLog.details || 'No extended metadata'}
                </pre>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold"
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
