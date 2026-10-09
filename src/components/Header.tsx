import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Radio,
  Flame,
  MessageSquare,
  ShoppingBag,
  Calculator,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Server,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAdminModal: () => void;
  openProfileModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openAdminModal,
  openProfileModal,
}) => {
  const { user, isAdmin, onlineCount, logout, openAuthModal, openVerifyModal } = useAuth();
  const [userDropdown, setUserDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-md">
      {/* Top Banner / Pulse Bar */}
      <div className="border-b border-neutral-800/80 bg-neutral-900 px-4 py-1.5 text-xs text-neutral-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-medium text-blue-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
              </span>
              <span>LIVE ARENA</span>
            </div>
            <span className="text-neutral-600 hidden sm:inline">•</span>
            <div className="hidden sm:flex items-center gap-1.5 text-neutral-400">
              <span>Connected Analysts:</span>
              <span className="font-bold text-white bg-neutral-800 px-1.5 py-0.5 rounded text-[11px]">
                {onlineCount} Online
              </span>
            </div>
            <span className="text-neutral-600 hidden md:inline">•</span>
            <div className="hidden md:flex items-center gap-1 text-emerald-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>100% Free Forever — Zero VIP Tiers</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-neutral-400 text-[11px]">
            {user && !user.isEmailVerified && (
              <button
                onClick={openVerifyModal}
                className="flex items-center gap-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 font-bold hover:bg-blue-500/30 transition-all"
              >
                <AlertTriangle className="w-3 h-3 text-blue-400" />
                <span>Verify Email</span>
              </button>
            )}
            <span className="font-mono text-neutral-400">UTC 2026</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('featured')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <Shield className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-wider text-white">SAFE PICKS</span>
                <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-black tracking-widest text-white">
                  ARENA
                </span>
              </div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-blue-400 -mt-0.5">
                Mathematical Sports Forecast
              </p>
            </div>
          </button>
        </div>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1">
          <button
            onClick={() => setActiveTab('featured')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              activeTab === 'featured'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Featured Picks</span>
          </button>

          <button
            onClick={() => setActiveTab('live-sports')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              activeTab === 'live-sports'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Live Matches</span>
          </button>

          <button
            onClick={() => setActiveTab('spaces')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              activeTab === 'spaces'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Betting Spaces</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Global Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              activeTab === 'analysis'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Poisson xG</span>
          </button>

          <button
            onClick={() => setActiveTab('marketplace')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              activeTab === 'marketplace'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Marketplace</span>
          </button>

          <button
            onClick={() => setActiveTab('scalability')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              activeTab === 'scalability'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>5M Arch</span>
          </button>

          {/* Prominent Admin Top Button if authorized */}
          {isAdmin && (
            <button
              onClick={openAdminModal}
              className="flex items-center gap-1.5 rounded-xl border border-blue-400/50 bg-blue-500/20 px-3 py-2 text-xs font-black text-blue-300 hover:bg-blue-600 hover:text-white transition-all ml-1 shadow-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Admin Panel</span>
            </button>
          )}
        </nav>

        {/* Right User Controls */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 py-1.5 pl-2 pr-3 hover:border-neutral-700 transition-all focus:outline-none"
              >
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white bg-blue-600"
                >
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white max-w-[110px] truncate">
                      {user.displayName}
                    </span>
                    {user.isEmailVerified ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-blue-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {user.role === 'admin' ? (
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">
                        Admin
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-400">Analyst</span>
                    )}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 ml-1" />
              </button>

              {/* Dropdown Menu */}
              {userDropdown && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl border border-neutral-800 bg-neutral-900 p-2 shadow-2xl z-50 text-white animate-in fade-in slide-in-from-top-2"
                  onClick={() => setUserDropdown(false)}
                >
                  <div className="px-3 py-2 border-b border-neutral-800 mb-1">
                    <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
                    <p className="text-[11px] text-neutral-400 truncate">@{user.username}</p>
                    <p className="text-[10px] text-neutral-500 truncate">{user.email}</p>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={openAdminModal}
                      className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-blue-400 hover:bg-neutral-800 transition-all text-left"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Admin Dashboard</span>
                    </button>
                  )}

                  <button
                    onClick={openProfileModal}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition-all text-left"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>My Profile & Settings</span>
                  </button>

                  {!user.isEmailVerified && (
                    <button
                      onClick={openVerifyModal}
                      className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-blue-300 hover:bg-neutral-800 transition-all text-left"
                    >
                      <AlertTriangle className="w-4 h-4 text-blue-400" />
                      <span>Verify Email Account</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-neutral-800"></div>

                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-all text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('login')}
                className="rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-bold text-white hover:border-blue-400 hover:text-blue-400 transition-all"
              >
                Log In
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-black text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-600/25"
              >
                Join Free
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Row */}
      <div className="flex lg:hidden overflow-x-auto border-t border-neutral-900 bg-neutral-950 px-2 py-2 gap-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('featured')}
          className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold ${
            activeTab === 'featured' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Featured</span>
        </button>

        <button
          onClick={() => setActiveTab('live-sports')}
          className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold ${
            activeTab === 'live-sports' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Live Scores</span>
        </button>

        <button
          onClick={() => setActiveTab('spaces')}
          className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold ${
            activeTab === 'spaces' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Spaces</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold ${
            activeTab === 'chat' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Global Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold ${
            activeTab === 'analysis' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>xG Poisson</span>
        </button>

        <button
          onClick={() => setActiveTab('marketplace')}
          className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold ${
            activeTab === 'marketplace' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Market</span>
        </button>

        {isAdmin && (
          <button
            onClick={openAdminModal}
            className="flex items-center gap-1.5 shrink-0 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/40 px-3 py-1.5 text-xs font-bold"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        )}
      </div>
    </header>
  );
};
