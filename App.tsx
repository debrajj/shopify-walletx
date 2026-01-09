import React from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation, Navigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Receipt, Settings as SettingsIcon, Wallet, BarChart3, Users, Clock, ChevronDown, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { config } from './config/env';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Customers from './pages/Customers';
import Automations from './pages/Automations';

// --- COMPONENTS ---

const NavTab: React.FC<{ to: string; icon: React.ElementType; label: string }> = ({ to, icon: Icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`
      }
    >
      <Icon className="h-4 w-4 transition-colors" />
      <span>{label}</span>
    </NavLink>
  );
};

const TopNavigation: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-xl transition-all">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo & Primary Nav */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
                <Wallet className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">{config.app.name}</span>
            </div>
            
            <div className="hidden md:flex items-center gap-1">
              <NavTab to="/dashboard" icon={LayoutDashboard} label="Overview" />
              <NavTab to="/customers" icon={Users} label="Customers" />
              <NavTab to="/transactions" icon={Receipt} label="Transactions" />
              <NavTab to="/reports" icon={BarChart3} label="Reports" />
              <NavTab to="/automations" icon={Clock} label="Automations" />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            <NavLink 
              to="/settings"
              className={({isActive}) => `p-2 rounded-full transition-colors ${isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
              <SettingsIcon className="h-5 w-5" />
            </NavLink>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-3 pl-2 group"
              >
                <div className="h-8 w-8 overflow-hidden rounded-full bg-slate-100 ring-2 ring-white shadow-sm">
                  <img src="https://picsum.photos/100/100" alt="Admin" className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{user?.name || 'Admin'}</p>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 truncate max-w-[100px]">{user?.storeName || 'Store Owner'}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg ring-1 ring-slate-900/5 z-20 py-1 origin-top-right animate-fade-in border border-slate-100">
                    <button 
                      onClick={logout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div className="md:hidden border-t border-slate-100 bg-white px-4 py-2 flex overflow-x-auto gap-2 no-scrollbar">
         <NavTab to="/dashboard" icon={LayoutDashboard} label="Overview" />
         <NavTab to="/customers" icon={Users} label="Customers" />
         <NavTab to="/transactions" icon={Receipt} label="Txns" />
         <NavTab to="/reports" icon={BarChart3} label="Reports" />
         <NavTab to="/automations" icon={Clock} label="Auto" />
      </div>
    </nav>
  );
};

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <TopNavigation />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
};

const PublicLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return null;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/automations" element={<Automations />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;