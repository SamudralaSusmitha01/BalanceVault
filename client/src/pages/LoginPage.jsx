import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Key,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  FileCheck2,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

export function LoginPage({ onNavigateRegister, onNavigateBootstrap }) {
  const { login, bootstrapStatus } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
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
      // Ensure seed data exists in the database
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
    setSeedSuccess('');
    try {
      const res = await api.seedDemo();
      setSeedSuccess(res.message || 'Environment seeded successfully with demo users and ledger entries.');
      setTimeout(() => setSeedSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to seed demo data');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0b0f19] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full bg-[#0f172a] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-lg shadow-emerald-500/20 mb-3.5">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center justify-center space-x-1.5 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-bold">
              ZERO-TRUST VAULT
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">BalanceVault</h1>
          <p className="text-xs text-gray-400 mt-1">
            Money movement with a cryptographic ledger you can mathematically prove
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center space-x-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {seedSuccess && (
          <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{seedSuccess}</span>
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
                className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Vault'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Evaluator Personas */}
        <div className="mt-7 pt-5 border-t border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>1-Click Evaluator Personas</span>
            </span>
            <button
              onClick={handleSeedEnvironment}
              disabled={seeding}
              className="text-[10px] text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <RefreshCw className={`w-3 h-3 ${seeding ? 'animate-spin' : ''}`} />
              <span>{seeding ? 'Seeding...' : 'Reset Demo Data'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Admin */}
            <button
              onClick={() => handleDemoLogin('admin@balancevault.com', 'Password123!')}
              className="p-2.5 bg-gray-900/90 hover:bg-gray-800/90 border border-gray-800 hover:border-red-500/50 rounded-2xl text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-red-400 text-[11px]">Admin</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-red-500/10 text-red-400 rounded border border-red-500/20 font-mono">
                  ROOT
                </span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">KYC & Account Control</div>
            </button>

            {/* Auditor */}
            <button
              onClick={() => handleDemoLogin('auditor@balancevault.com', 'Password123!')}
              className="p-2.5 bg-gray-900/90 hover:bg-gray-800/90 border border-gray-800 hover:border-amber-500/50 rounded-2xl text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-400 text-[11px]">Auditor</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20 font-mono">
                  AUDIT
                </span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">Read-Only Oversight</div>
            </button>

            {/* Alice */}
            <button
              onClick={() => handleDemoLogin('alice@balancevault.com', 'Password123!')}
              className="p-2.5 bg-gray-900/90 hover:bg-gray-800/90 border border-gray-800 hover:border-emerald-500/50 rounded-2xl text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-400 text-[11px]">Alice</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 font-mono">
                  USER
                </span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">Active Sender ($10k)</div>
            </button>

            {/* Bob */}
            <button
              onClick={() => handleDemoLogin('bob@balancevault.com', 'Password123!')}
              className="p-2.5 bg-gray-900/90 hover:bg-gray-800/90 border border-gray-800 hover:border-teal-500/50 rounded-2xl text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-teal-400 text-[11px]">Bob</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-teal-500/10 text-teal-400 rounded border border-teal-500/20 font-mono">
                  USER
                </span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">Active Recipient ($5k)</div>
            </button>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400 pt-2">
          <button
            onClick={onNavigateRegister}
            className="hover:text-emerald-400 transition-colors flex items-center space-x-1"
          >
            <span>Create new account</span>
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
