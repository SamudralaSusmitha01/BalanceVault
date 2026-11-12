import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import {
  KeyRound,
  ShieldAlert,
  CheckCircle,
  ArrowLeft,
  AlertCircle,
  ArrowRight,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Info
} from 'lucide-react';

export function BootstrapAdminPage({ onNavigateLogin }) {
  const { bootstrapAdmin, bootstrapStatus, checkBootstrap } = useAuth();
  const [fullName, setFullName] = useState('Chief Systems Administrator');
  const [email, setEmail] = useState('admin@balancevault.com');
  const [password, setPassword] = useState('AdminSecurePassword2026!');
  const [secret, setSecret] = useState('BalanceVaultAdminBootstrap2026!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(bootstrapStatus);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.getBootstrapStatus();
        setStatus(res);
      } catch (err) {
        // ignore
      }
    };
    fetchStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await bootstrapAdmin({
        fullName,
        email,
        password,
        secret
      });
      await checkBootstrap();
    } catch (err) {
      setError(err.message || 'Bootstrap initialization failed');
    } finally {
      setLoading(false);
    }
  };

  const isLocked = Boolean(status.isLocked);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0b0f19] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-lg w-full bg-[#0f172a] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        <button
          onClick={onNavigateLogin}
          className="flex items-center space-x-1.5 text-xs text-gray-400 hover:text-white mb-6 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to sign in</span>
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-600 to-red-500 shadow-lg shadow-amber-500/20 mb-3">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">First-Administrator Bootstrap</h1>
          <p className="text-xs text-gray-400 mt-1">One-time root administrative provisioning ceremony</p>
        </div>

        {/* Lockout Banner */}
        <div className={`p-4 rounded-2xl border mb-6 text-xs flex items-start space-x-3.5 ${
          isLocked
            ? 'bg-rose-950/30 border-rose-900/60 text-rose-300'
            : 'bg-amber-950/30 border-amber-900/60 text-amber-300'
        }`}>
          {isLocked ? (
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-bold flex items-center space-x-2">
              <span>{isLocked ? 'BOOTSTRAP PERMANENTLY LOCKED' : 'BOOTSTRAP PROTOCOL ACTIVE'}</span>
              <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full border ${
                isLocked ? 'bg-rose-500/20 border-rose-500/30' : 'bg-amber-500/20 border-amber-500/30'
              }`}>
                {isLocked ? 'HTTP 403' : 'READY'}
              </span>
            </div>
            <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
              {isLocked
                ? 'A root administrator already exists in this environment. For tamper-resistance and access control separation, further bootstrap requests are permanently forbidden.'
                : 'No administrator exists. You can now execute the single-use bootstrap process with the configured master secret.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center space-x-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Master Bootstrap Secret</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                disabled={isLocked}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Enter master bootstrap secret"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-mono disabled:opacity-50"
              />
            </div>
            <span className="text-[10px] text-gray-500 mt-1 block font-mono">
              Default secret: <code className="text-gray-400">BalanceVaultAdminBootstrap2026!</code>
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Root Admin Legal Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                disabled={isLocked}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Root Admin Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                disabled={isLocked}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 disabled:opacity-50 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Root Admin Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                disabled={isLocked}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 disabled:opacity-50 font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl flex items-start space-x-2 text-[11px] text-gray-400">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              This operation executes a secure database bootstrap operator transaction, assigns the ADMIN role, and permanently records an immutable security audit event.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading || isLocked}
            className="w-full py-3 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-4"
          >
            <span>{loading ? 'Bootstrapping Admin...' : 'Execute One-Time Bootstrap'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
