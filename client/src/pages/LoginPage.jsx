import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles, Key, AlertCircle } from 'lucide-react';

export function LoginPage({ onNavigateRegister, onNavigateBootstrap }) {
  const { login, bootstrapStatus } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setLoading(true);
    try {
      // First ensure demo accounts exist
      await api.seedDemo().catch(() => {});
      await login(demoEmail, demoPassword);
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedEnvironment = async () => {
    setSeeding(true);
    setError('');
    try {
      const res = await api.seedDemo();
      alert(res.message);
    } catch (err) {
      setError(err.message || 'Failed to seed demo data');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0b0f19] relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-[#0f172a] border border-gray-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-lg shadow-emerald-500/20 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">BalanceVault</h1>
          <p className="text-sm text-gray-400 mt-1">Sign in to your auditable financial vault</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Demo Evaluation Roles */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>1-Click Evaluator Personas</span>
            </span>
            <button
              onClick={handleSeedEnvironment}
              disabled={seeding}
              className="text-[10px] text-emerald-400 hover:underline"
            >
              {seeding ? 'Seeding...' : 'Reset Demo Data'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleDemoLogin('admin@balancevault.com', 'Password123!')}
              className="p-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-red-500/40 rounded-xl text-left transition-all"
            >
              <div className="font-semibold text-red-400">Admin</div>
              <div className="text-[10px] text-gray-500">Root operations & KYC</div>
            </button>

            <button
              onClick={() => handleDemoLogin('auditor@balancevault.com', 'Password123!')}
              className="p-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-amber-500/40 rounded-xl text-left transition-all"
            >
              <div className="font-semibold text-amber-400">Auditor</div>
              <div className="text-[10px] text-gray-500">Read-only audit & proof</div>
            </button>

            <button
              onClick={() => handleDemoLogin('alice@balancevault.com', 'Password123!')}
              className="p-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-emerald-500/40 rounded-xl text-left transition-all"
            >
              <div className="font-semibold text-emerald-400">Alice (User)</div>
              <div className="text-[10px] text-gray-500">Active account holder</div>
            </button>

            <button
              onClick={() => handleDemoLogin('bob@balancevault.com', 'Password123!')}
              className="p-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-emerald-500/40 rounded-xl text-left transition-all"
            >
              <div className="font-semibold text-teal-400">Bob (User)</div>
              <div className="text-[10px] text-gray-500">Active recipient account</div>
            </button>
          </div>
        </div>

        {/* Links */}
        <div className="mt-6 flex items-center justify-between text-xs text-gray-400">
          <button
            onClick={onNavigateRegister}
            className="hover:text-emerald-400 transition-colors"
          >
            Create user account
          </button>

          {!bootstrapStatus.isLocked && (
            <button
              onClick={onNavigateBootstrap}
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Bootstrap Root Admin</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
