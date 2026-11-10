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
  Layers
} from 'lucide-react';

export function Navbar({ activeTab, setActiveTab }) {
  const { user, logout, isAdmin, isAuditor } = useAuth();
  const [healthStatus, setHealthStatus] = useState('ONLINE');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.getReady();
        setHealthStatus('ONLINE');
      } catch {
        setHealthStatus('DEGRADED');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'My Vault', icon: Vault, show: true },
    { id: 'transfer', label: 'Money Movement', icon: ArrowLeftRight, show: user?.role === 'USER' || isAdmin },
    { id: 'ledger', label: 'Provable Ledger', icon: FileCheck2, show: true },
    { id: 'admin', label: 'Admin Ops', icon: UserCheck, show: isAdmin },
    { id: 'audit', label: 'Audit Trail', icon: ScrollText, show: isAuditor }
  ];

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30 rounded-full">ADMIN</span>;
      case 'AUDITOR':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full">AUDITOR</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">USER</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0f172a]/90 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  BalanceVault
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                  v1.0-PROVABLE
                </span>
              </div>
              <p className="text-[11px] text-gray-400 hidden sm:block">Money movement with a ledger you can prove</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.filter(item => item.show).map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User profile & actions */}
          <div className="flex items-center space-x-4">
            {/* Health pill */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-gray-900 border border-gray-800 text-xs">
              <span className={`w-2 h-2 rounded-full ${healthStatus === 'ONLINE' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-gray-400 font-mono text-[11px]">LEDGER {healthStatus}</span>
            </div>

            {user && (
              <div className="flex items-center space-x-3 pl-2 border-l border-gray-800">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-medium text-gray-200">{user.fullName}</div>
                  <div className="flex items-center justify-end space-x-1 mt-0.5">
                    {getRoleBadge(user.role)}
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-gray-800/80 space-x-2">
          {navItems.filter(item => item.show).map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-gray-400 hover:text-white'
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
