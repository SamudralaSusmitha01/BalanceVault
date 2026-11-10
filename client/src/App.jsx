import React, { useState } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { BootstrapAdminPage } from './pages/BootstrapAdminPage.jsx';
import { UserDashboard } from './pages/UserDashboard.jsx';
import { TransferPage } from './pages/TransferPage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { LedgerProofPage } from './pages/LedgerProofPage.jsx';
import { AuditLogsPage } from './pages/AuditLogsPage.jsx';

export default function App() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authView, setAuthView] = useState('login'); // 'login' | 'register' | 'bootstrap'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-emerald-400 font-mono text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>INITIALIZING PROVABLE VAULT...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated routing
  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterPage onNavigateLogin={() => setAuthView('login')} />;
    }
    if (authView === 'bootstrap') {
      return <BootstrapAdminPage onNavigateLogin={() => setAuthView('login')} />;
    }
    return (
      <LoginPage
        onNavigateRegister={() => setAuthView('register')}
        onNavigateBootstrap={() => setAuthView('bootstrap')}
      />
    );
  }

  // Authenticated Dashboard Layout
  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <UserDashboard
            onNavigateTransfer={() => setActiveTab('transfer')}
            onNavigateLedger={() => setActiveTab('ledger')}
          />
        )}

        {activeTab === 'transfer' && (
          <TransferPage onNavigateLedger={() => setActiveTab('ledger')} />
        )}

        {activeTab === 'ledger' && (
          <LedgerProofPage />
        )}

        {activeTab === 'admin' && (
          <AdminPage />
        )}

        {activeTab === 'audit' && (
          <AuditLogsPage />
        )}
      </main>

      <footer className="border-t border-gray-800/60 py-6 text-center text-xs text-gray-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>BalanceVault — Money movement with a ledger you can prove</span>
          <span>Zero-Trust SHA-256 Double-Entry Invariant Core</span>
        </div>
      </footer>
    </div>
  );
}
