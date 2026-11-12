import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  FileCheck2
} from 'lucide-react';

export function RegisterPage({ onNavigateLogin }) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('USER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        fullName,
        email,
        password,
        role
      });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0b0f19] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/3 w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full bg-[#0f172a] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        <button
          onClick={onNavigateLogin}
          className="flex items-center space-x-1.5 text-xs text-gray-400 hover:text-white mb-6 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to sign in</span>
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-lg shadow-emerald-500/20 mb-3">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-xs text-gray-400 mt-1">Join the provable financial ledger ecosystem</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center space-x-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Legal Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Eleanor Vance"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="eleanor@vault.com"
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
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
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

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Account Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('USER')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  role === 'USER'
                    ? 'bg-emerald-950/30 border-emerald-500/50 text-white ring-1 ring-emerald-500/30'
                    : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-1">
                  <UserCheck className={`w-3.5 h-3.5 ${role === 'USER' ? 'text-emerald-400' : 'text-gray-400'}`} />
                  <span className="text-xs font-bold text-gray-200">Account Holder</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-tight">
                  Standard account with onboarding KYC & money transfers.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRole('AUDITOR')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  role === 'AUDITOR'
                    ? 'bg-amber-950/30 border-amber-500/50 text-white ring-1 ring-amber-500/30'
                    : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-1">
                  <FileCheck2 className={`w-3.5 h-3.5 ${role === 'AUDITOR' ? 'text-amber-400' : 'text-gray-400'}`} />
                  <span className="text-xs font-bold text-gray-200">Auditor</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-tight">
                  Regulatory read-only access to audit trail & SHA-256 proofs.
                </p>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          <span>Already have an account? </span>
          <button
            onClick={onNavigateLogin}
            className="text-emerald-400 hover:underline font-semibold"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
