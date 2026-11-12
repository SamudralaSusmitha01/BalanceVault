import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import {
  ShieldCheck,
  Vault,
  ArrowLeftRight,
  FileCheck2,
  ScrollText,
  UserCheck,
  LogOut,
  Activity,
  Layers,
  Sparkles,
  ShieldAlert,
  Scale
} from 'lucide-react';

export function Navbar({ activeTab, setActiveTab }) {
  const { user, logout, isAdmin, isAuditor } = useAuth();
  const [healthStatus, setHealthStatus] = useState('CHECKING');
  const [uptimeSeconds, setUptimeSeconds] = useState(0);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await api.getReady();
        setHealthStatus(res.status === 'READY' ? 'READY' : 'ONLINE');
        if (res.uptimeSeconds) setUptimeSeconds(res.uptimeSeconds);
      } catch {
        setHealthStatus('DEGRADED');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'My Vault', icon: Vault, show: true, badge: user?.role === 'USER' ? 'Active' : null },
    { id: 'transfer', label: 'Money Movement', icon: ArrowLeftRight, show: user?.role === 'USER' || isAdmin },
    { id: 'ledger', label: 'Provable Ledger', icon: FileCheck2, show: true, badge: 'SHA-256' },
    { id: 'admin', label: 'Admin Ops', icon: UserCheck, show: isAdmin, badge: 'Root' },
    { id: 'audit', label: 'Audit Trail', icon: ScrollText, show: isAuditor }
  ];

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-full tracking-wide">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>ADMINISTRATOR</span>
          </span>
        );
      case 'AUDITOR':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full tracking-wide">
            <Scale className="w-3 h-3 text-amber-400" />
            <span>AUDITOR (READ-ONLY)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full tracking-wide">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>ACCOUNT HOLDER</span>
          </span>
        );
    }
  };

  const getRoleHeaderHighlight = (role) => {
    if (role === 'ADMIN') {
      return (
        <div className="bg-gradient-to-r from-rose-950/40 via-red-900/20 to-transparent border-b border-rose-900/40 px-4 py-1.5 text-center text-[11px] text-rose-300 font-mono flex items-center justify-center space-x-2">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span><strong>SECURITY PRIVILEGE:</strong> Root Administration Mode Active. Server-enforced KYC approvals and account freeze authorizations enabled.</span>
        </div>
      );
    }
    if (role === 'AUDITOR') {
      return (
        <div className="bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-transparent border-b border-amber-900/40 px-4 py-1.5 text-center text-[11px] text-amber-300 font-mono flex items-center justify-center space-x-2">
          <Scale className="w-3.5 h-3.5 text-amber-400" />
          <span><strong>REGULATORY OVERSIGHT:</strong> Compliance Auditor View. Strict read-only inspection of the cryptographic ledger and audit trail. Money movement is prohibited.</span>
        </div>
      );
    }
    return null;
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0b1324]/90 backdrop-blur-xl border-b border-slate-800/80 shadow-lg shadow-black/20">
      {/* Role Notice Bar for Admin / Auditor */}
      {user && getRoleHeaderHighlight(user.role)}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center space-x-3.5 cursor-pointer group"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-[#070b14] rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  BalanceVault
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-md font-semibold tracking-wider">
                  PROVABLE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block tracking-tight font-medium">
                Money movement with a ledger you can prove
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center space-x-1.5 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/60">
            {navItems.filter(item => item.show).map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase ${
                      isActive ? 'bg-emerald-400/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* System status & user actions */}
          <div className="flex items-center space-x-3.5">
            {/* Liveness / Readiness status pill */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
              <span className={`w-2 h-2 rounded-full ${
                healthStatus === 'READY' || healthStatus === 'ONLINE'
                  ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400'
                  : 'bg-amber-400'
              }`} />
              <span className="text-slate-300 font-mono text-[11px] font-medium tracking-tight">
                LEDGER {healthStatus}
              </span>
            </div>

            {user && (
              <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-100 tracking-tight leading-none mb-1">
                    {user.fullName}
                  </div>
                  <div>
                    {getRoleBadge(user.role)}
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out of BalanceVault"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-150"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2.5 border-t border-slate-800/80 space-x-2 no-scrollbar">
          {navItems.filter(item => item.show).map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
